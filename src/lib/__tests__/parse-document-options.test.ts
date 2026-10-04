import { describe, it, expect } from 'vitest';
import {
    parseChoiceGroupsFromFormData,
    parsePackagesFromFormData,
} from '@/lib/parse-document-options';

describe('parsePackagesFromFormData', () => {
    it('parses package fields and nested line items', () => {
        const fd = new FormData();
        fd.set('packages[0][id]', 'pkg-1');
        fd.set('packages[0][label]', 'Basic');
        fd.set('packages[0][description]', 'Simple approach');
        fd.set('packages[0][recommended]', '1');
        fd.set('packages[0][items][0][id]', 'li-1');
        fd.set('packages[0][items][0][description]', 'Labor');
        fd.set('packages[0][items][0][quantity]', '2');
        fd.set('packages[0][items][0][unitPrice]', '100');
        fd.set('packages[0][items][0][discountPercent]', '10');
        fd.set('packages[0][items][0][pendingClientApproval]', '0');

        const packages = parsePackagesFromFormData(fd);
        expect(packages).toHaveLength(1);
        expect(packages[0].id).toBe('pkg-1');
        expect(packages[0].label).toBe('Basic');
        expect(packages[0].recommended).toBe(true);
        expect(packages[0].lineItems[0].total).toBe(180);
    });

    it('keeps markdown descriptions and only the first recommended package', () => {
        const fd = new FormData();
        fd.set('packages[0][id]', 'pkg-1');
        fd.set('packages[0][label]', 'Basic');
        fd.set('packages[0][description]', '**Included**\n\n- Labor\n- Cleanup');
        fd.set('packages[0][recommended]', '1');
        fd.set('packages[0][items][0][description]', 'Labor');
        fd.set('packages[0][items][0][quantity]', '1');
        fd.set('packages[0][items][0][unitPrice]', '100');
        fd.set('packages[1][id]', 'pkg-2');
        fd.set('packages[1][label]', 'Premium');
        fd.set('packages[1][description]', 'Adds *finish* work');
        fd.set('packages[1][recommended]', 'true');
        fd.set('packages[1][items][0][description]', 'Finish');
        fd.set('packages[1][items][0][quantity]', '1');
        fd.set('packages[1][items][0][unitPrice]', '50');

        const packages = parsePackagesFromFormData(fd);
        expect(packages[0].description).toBe('**Included**\n\n- Labor\n- Cleanup');
        expect(packages[0].recommended).toBe(true);
        expect(packages[1].description).toBe('Adds *finish* work');
        expect(packages[1].recommended).toBeUndefined();
    });
});

describe('parseChoiceGroupsFromFormData', () => {
    it('parses nested choices and items', () => {
        const fd = new FormData();
        fd.set('choiceGroups[0][id]', 'grp-1');
        fd.set('choiceGroups[0][label]', 'Flooring');
        fd.set('choiceGroups[0][description]', 'Pick one **material**.');
        fd.set('choiceGroups[0][required]', '1');
        fd.set('choiceGroups[0][choices][0][id]', 'ch-1');
        fd.set('choiceGroups[0][choices][0][label]', 'Hardwood');
        fd.set('choiceGroups[0][choices][0][description]', '- Solid oak\n- Site finish');
        fd.set('choiceGroups[0][choices][0][items][0][description]', 'Oak');
        fd.set('choiceGroups[0][choices][0][items][0][quantity]', '1');
        fd.set('choiceGroups[0][choices][0][items][0][unitPrice]', '800');
        fd.set('choiceGroups[0][choices][0][items][0][discountPercent]', '0');
        fd.set('choiceGroups[0][choices][0][items][0][pendingClientApproval]', '0');

        const groups = parseChoiceGroupsFromFormData(fd);
        expect(groups).toHaveLength(1);
        expect(groups[0].label).toBe('Flooring');
        expect(groups[0].description).toBe('Pick one **material**.');
        expect(groups[0].required).toBe(true);
        expect(groups[0].choices[0].label).toBe('Hardwood');
        expect(groups[0].choices[0].description).toBe('- Solid oak\n- Site finish');
        expect(groups[0].choices[0].lineItems[0].total).toBe(800);
        expect(groups[0].choices[0].recommended).toBeUndefined();
    });

    it('keeps only the first recommended choice in a group', () => {
        const fd = new FormData();
        fd.set('choiceGroups[0][label]', 'Flooring');
        fd.set('choiceGroups[0][choices][0][label]', 'Laminate');
        fd.set('choiceGroups[0][choices][0][recommended]', '1');
        fd.set('choiceGroups[0][choices][0][items][0][description]', 'Laminate');
        fd.set('choiceGroups[0][choices][0][items][0][quantity]', '1');
        fd.set('choiceGroups[0][choices][0][items][0][unitPrice]', '200');
        fd.set('choiceGroups[0][choices][1][label]', 'Hardwood');
        fd.set('choiceGroups[0][choices][1][recommended]', 'true');
        fd.set('choiceGroups[0][choices][1][items][0][description]', 'Oak');
        fd.set('choiceGroups[0][choices][1][items][0][quantity]', '1');
        fd.set('choiceGroups[0][choices][1][items][0][unitPrice]', '800');

        const groups = parseChoiceGroupsFromFormData(fd);
        expect(groups[0].choices[0].recommended).toBe(true);
        expect(groups[0].choices[1].recommended).toBeUndefined();
    });
});
