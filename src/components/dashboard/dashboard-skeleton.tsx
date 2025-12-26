import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardSkeleton() {
    return (
        <main className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-[100px]" />
                            <Skeleton className="h-4 w-4 rounded-full" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-[60px] mb-2" />
                            <Skeleton className="h-3 w-[140px]" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts & Activity Row */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Revenue Chart Skeleton */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-[200px] mb-2" />
                            <Skeleton className="h-4 w-[150px]" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-[300px] w-full rounded-md" />
                        </CardContent>
                    </Card>
                </div>

                {/* Pending Quotes Skeleton */}
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader className="flex flex-row items-center gap-2">
                            <Skeleton className="h-5 w-5 rounded-full" />
                            <div className="grid gap-1">
                                <Skeleton className="h-5 w-[150px]" />
                                <Skeleton className="h-4 w-[100px]" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <Skeleton className="h-9 w-9 rounded-full" />
                                        <div className="grid gap-1 flex-1">
                                            <Skeleton className="h-4 w-[120px]" />
                                            <Skeleton className="h-3 w-[80px]" />
                                        </div>
                                        <Skeleton className="h-4 w-[60px]" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Recent Orders Skeleton */}
            <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <div className="grid gap-1">
                        <Skeleton className="h-5 w-[200px]" />
                        <Skeleton className="h-4 w-[100px]" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <Skeleton className="h-9 w-9 rounded-full" />
                                <div className="grid gap-1 flex-1">
                                    <Skeleton className="h-4 w-[150px]" />
                                    <Skeleton className="h-3 w-[100px]" />
                                </div>
                                <Skeleton className="h-4 w-[80px]" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </main>
    );
}
