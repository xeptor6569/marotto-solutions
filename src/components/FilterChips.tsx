'use client';

import { Box, Button, Flex, Text } from "@radix-ui/themes";

export interface FilterChipOption<T extends string> {
    value: T;
    label: string;
    count?: number;
}

export default function FilterChips<T extends string>({
    label,
    options,
    value,
    onChange,
}: {
    label: string;
    options: FilterChipOption<T>[];
    value: T;
    onChange: (value: T) => void;
}) {
    if (options.length <= 1) return null;

    return (
        <Box style={{ width: "100%", maxWidth: "100%" }}>
            <Text as="label" size="2">{label}</Text>
            <Box
                mt="1"
                style={{
                    overflowX: "auto",
                    WebkitOverflowScrolling: "touch",
                    marginLeft: -2,
                    paddingBottom: 4,
                }}
            >
                <Flex gap="2" wrap="nowrap" pb="1" style={{ width: "max-content", maxWidth: "100%" }}>
                    {options.map((option) => (
                        <Button
                            key={option.value}
                            size="1"
                            variant={value === option.value ? "solid" : "soft"}
                            onClick={() => onChange(option.value)}
                            style={{ flexShrink: 0 }}
                        >
                            {option.label}
                            {typeof option.count === "number" ? (
                                <Text size="1" style={{ opacity: 0.75 }}>{option.count}</Text>
                            ) : null}
                        </Button>
                    ))}
                </Flex>
            </Box>
        </Box>
    );
}
