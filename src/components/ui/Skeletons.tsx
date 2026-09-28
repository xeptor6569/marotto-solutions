import { Box, Card, Container, Flex, Grid, Skeleton } from '@radix-ui/themes';

/** Route-level loading placeholders shaped like the pages they stand in for. */

function HeaderSkeleton({ withAction = true }: { withAction?: boolean }) {
    return (
        <Flex justify="between" align="end" gap="3" mb="5">
            <Flex direction="column" gap="2">
                <Skeleton width="72px" height="12px" />
                <Skeleton width="220px" height="32px" />
            </Flex>
            {withAction ? <Skeleton width="120px" height="36px" /> : null}
        </Flex>
    );
}

function RowSkeleton() {
    return (
        <Flex align="center" justify="between" gap="3" py="3" className="skeleton-row">
            <Flex direction="column" gap="2" style={{ flex: 1 }}>
                <Skeleton width="45%" height="14px" />
                <Skeleton width="30%" height="11px" />
            </Flex>
            <Skeleton width="72px" height="20px" />
            <Skeleton width="84px" height="16px" />
        </Flex>
    );
}

export function PageSkeleton() {
    return (
        <Container size="4" p={{ initial: '3', sm: '5' }} aria-busy="true" aria-label="Loading">
            <HeaderSkeleton />
            <Grid columns={{ initial: '1', sm: '3' }} gap="4" mb="4">
                {[0, 1, 2].map((i) => (
                    <Card key={i} size="2">
                        <Flex direction="column" gap="3">
                            <Skeleton width="40%" height="11px" />
                            <Skeleton width="60%" height="28px" />
                        </Flex>
                    </Card>
                ))}
            </Grid>
            <Card size="2">
                {[0, 1, 2, 3].map((i) => <RowSkeleton key={i} />)}
            </Card>
        </Container>
    );
}

export function ListSkeleton() {
    return (
        <Container size="4" p={{ initial: '3', sm: '5' }} aria-busy="true" aria-label="Loading">
            <HeaderSkeleton />
            <Card size="2" mb="4">
                <Flex direction="column" gap="3">
                    <Skeleton height="40px" />
                    <Flex gap="2">
                        {[56, 72, 64, 60].map((w, i) => <Skeleton key={i} width={`${w}px`} height="30px" style={{ borderRadius: 999 }} />)}
                    </Flex>
                </Flex>
            </Card>
            <Card size="2">
                {[0, 1, 2, 3, 4, 5].map((i) => <RowSkeleton key={i} />)}
            </Card>
        </Container>
    );
}

export function DocumentSkeleton() {
    return (
        <Container size="3" p={{ initial: '3', sm: '5' }} aria-busy="true" aria-label="Loading">
            <Flex justify="between" gap="3" mb="4">
                <Skeleton width="180px" height="28px" />
                <Flex gap="2">
                    <Skeleton width="90px" height="36px" />
                    <Skeleton width="90px" height="36px" />
                </Flex>
            </Flex>
            <Card size="3">
                <Flex justify="between" mb="5">
                    <Flex direction="column" gap="2">
                        <Skeleton width="160px" height="22px" />
                        <Skeleton width="110px" height="12px" />
                    </Flex>
                    <Flex direction="column" gap="2" align="end">
                        <Skeleton width="90px" height="18px" />
                        <Skeleton width="120px" height="12px" />
                        <Skeleton width="100px" height="12px" />
                    </Flex>
                </Flex>
                <Box mb="4"><Skeleton width="200px" height="14px" /></Box>
                {[0, 1, 2].map((i) => <RowSkeleton key={i} />)}
                <Flex justify="end" mt="4">
                    <Skeleton width="180px" height="40px" />
                </Flex>
            </Card>
        </Container>
    );
}

export function FormSkeleton() {
    return (
        <Container size="4" p={{ initial: '3', sm: '5' }} aria-busy="true" aria-label="Loading">
            <HeaderSkeleton withAction={false} />
            <Grid columns={{ initial: '1', lg: '2' }} gap="5">
                <Card size="3">
                    <Flex direction="column" gap="4">
                        {[0, 1, 2, 3].map((i) => (
                            <Flex key={i} direction="column" gap="2">
                                <Skeleton width="90px" height="12px" />
                                <Skeleton height="36px" />
                            </Flex>
                        ))}
                    </Flex>
                </Card>
                <Card size="3" className="skeleton-preview">
                    <Flex direction="column" gap="3">
                        <Skeleton width="50%" height="20px" />
                        <Skeleton width="30%" height="12px" />
                        <Skeleton height="120px" />
                    </Flex>
                </Card>
            </Grid>
        </Container>
    );
}
