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
});

describe('parseChoiceGroupsFromFormData', () => {
    it('parses nested choices and items', () => {
        const fd = new FormData();
        fd.set('choiceGroups[0][id]', 'grp-1');
        fd.set('choiceGroups[0][label]', 'Flooring');
        fd.set('choiceGroups[0][required]', '1');
        fd.set('choiceGroups[0][choices][0][id]', 'ch-1');
        fd.set('choiceGroups[0][choices][0][label]', 'Hardwood');
        fd.set('choiceGroups[0][choices][0][items][0][description]', 'Oak');
        fd.set('choiceGroups[0][choices][0][items][0][quantity]', '1');
        fd.set('choiceGroups[0][choices][0][items][0][unitPrice]', '800');
        fd.set('choiceGroups[0][choices][0][items][0][discountPercent]', '0');
        fd.set('choiceGroups[0][choices][0][items][0][pendingClientApproval]', '0');

        const groups = parseChoiceGroupsFromFormData(fd);
        expect(groups).toHaveLength(1);
        expect(groups[0].label).toBe('Flooring');
        expect(groups[0].required).toBe(true);
        expect(groups[0].choices[0].label).toBe('Hardwood');
        expect(groups[0].choices[0].lineItems[0].total).toBe(800);
    });
});
