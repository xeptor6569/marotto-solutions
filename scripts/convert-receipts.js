const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const INPUT_DIR = path.join(__dirname, '../temp'); // Default looks in temp/
const OUTPUT_FILE = path.join(__dirname, '../receipts_import.json');

function parseReceiptText(text, filename) {
    // Regex logic tailored to the template:
    // "RECEIPT Receipt No: RCPT-00022 Date: December 04, 2025"
    // "Received From: Elaine Zambetti..."
    // "Total Amount Received: $50.00"

    // Naive parsing based on template structure
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    // Extract ID
    const numberMatch = text.match(/Receipt No:\s*(\w+-\d+)/i) || text.match(/RCPT-\d+/);
    const id = numberMatch ? numberMatch[1] || numberMatch[0] : `RCPT-${Math.floor(Math.random() * 10000)}`;

    // Extract Date
    const dateMatch = text.match(/Date:\s*(.+)/i);
    const dateStr = dateMatch ? dateMatch[1].trim() : new Date().toISOString();
    // Try to parse relative date into ISO
    const date = new Date(dateStr).toISOString().split('T')[0] || new Date().toISOString().split('T')[0];

    // Received From (Heuristic: Look for lines after "Received From:")
    const receivedFromIndex = lines.findIndex(l => /Received From:/i.test(l));
    let customerName = "Unknown Customer";
    let customerAddress = "";
    if (receivedFromIndex !== -1 && lines[receivedFromIndex + 1]) {
        customerName = lines[receivedFromIndex + 1];
        // Address might be next few lines until "For Invoice No" or "Description"
        const nextMarkerIndex = lines.findIndex((l, i) => i > receivedFromIndex && (/For Invoice No/i.test(l) || /Description/i.test(l)));
        if (nextMarkerIndex > receivedFromIndex + 2) {
            customerAddress = lines.slice(receivedFromIndex + 2, nextMarkerIndex).join('\n');
        }
    }

    // Amount
    const amountMatch = text.match(/Total Amount Received:\s*\$([\d,]+\.?\d*)/i);
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;

    // Description (Heuristic: Look for bullets or lines after Description)
    const descIndex = lines.findIndex(l => /Description of Services:/i.test(l));
    let description = "Service";
    if (descIndex !== -1 && lines[descIndex + 1]) {
        // Often has bullet point
        description = lines[descIndex + 1].replace(/^•\s*/, '').replace(/^- \s*/, '');
    }

    // Number (parse from ID)
    const numberPart = id.match(/\d+$/);
    const number = numberPart ? parseInt(numberPart[0]) : 0;

    return {
        id,
        number,
        type: 'receipt',
        date,
        customer: {
            id: `gen-${Math.random().toString(36).substr(2, 9)}`,
            name: customerName,
            address: customerAddress
        },
        lineItems: [
            {
                id: `item-${Math.random().toString(36).substr(2, 9)}`,
                description,
                quantity: 1,
                unitPrice: amount,
                total: amount
            }
        ],
        subtotal: amount,
        total: amount,
        status: 'paid', // Receipts are paid
        tags: ['Imported'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}

async function main() {
    if (!fs.existsSync(INPUT_DIR)) {
        console.error(`Input directory ${INPUT_DIR} does not exist.`);
        process.exit(1);
    }

    const files = fs.readdirSync(INPUT_DIR).filter(f => f.endsWith('.docx') && !f.startsWith('~$')); // Ignore Word temp files
    console.log(`Found ${files.length} DOCX files in ${INPUT_DIR}`);

    const receipts = [];

    for (const file of files) {
        const filePath = path.join(INPUT_DIR, file);
        try {
            // Use macos textutil to convert to stdout
            const txt = execSync(`textutil -convert txt "${filePath}" -stdout`, { encoding: 'utf-8' });
            const receipt = parseReceiptText(txt, file);
            receipts.push(receipt);
            console.log(`Parsed ${file} -> ${receipt.id} ($${receipt.total})`);
        } catch (e) {
            console.error(`Failed to convert ${file}:`, e.message);
        }
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(receipts, null, 2));
    console.log(`\nSuccessfully converted ${receipts.length} receipts to ${OUTPUT_FILE}`);
}

main();
