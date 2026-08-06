'use client';

import { Box, Flex, Text } from '@radix-ui/themes';
import SettingsSectionForm from './SettingsSectionForm';
import type { AppConfig } from '@/lib/types';

export default function DocumentsSettingsForm({ config }: { config: Partial<AppConfig> }) {
    return (
        <SettingsSectionForm section="documents">
            <Box>
                <Text as="label" size="2" weight="bold">Create / edit view</Text>
                <Text as="p" size="1" color="gray" mt="1" mb="2">
                    Choose how invoice, estimate, quote, and receipt editors are laid out.
                </Text>
                <Flex direction="column" gap="2">
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minHeight: 44, cursor: 'pointer' }}>
                        <input
                            type="radio"
                            name="documentFormMode"
                            value="guided"
                            defaultChecked={(config.documentFormMode || 'guided') === 'guided'}
                            style={{ marginTop: 4 }}
                        />
                        <Box>
                            <Text as="div" size="2" weight="medium">Guided flow</Text>
                            <Text as="div" size="1" color="gray">
                                One step at a time: Customer → Details → Items → Review. Best on phones.
                            </Text>
                        </Box>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minHeight: 44, cursor: 'pointer' }}>
                        <input
                            type="radio"
                            name="documentFormMode"
                            value="full"
                            defaultChecked={config.documentFormMode === 'full'}
                            style={{ marginTop: 4 }}
                        />
                        <Box>
                            <Text as="div" size="2" weight="medium">Full page</Text>
                            <Text as="div" size="1" color="gray">
                                Show every section on one page with jump navigation. Best on desktop.
                            </Text>
                        </Box>
                    </label>
                </Flex>
            </Box>
        </SettingsSectionForm>
    );
}
