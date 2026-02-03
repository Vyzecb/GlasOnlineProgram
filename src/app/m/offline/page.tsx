import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OfflinePage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Offline</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Je bent offline. Wij bewaren je acties en synchroniseren zodra je weer online bent.
      </CardContent>
    </Card>
  );
}
