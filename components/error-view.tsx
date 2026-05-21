import { cn } from "@/lib/utils";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ErrorViewProps {
  title: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorView({ title, message, onRetry, className }: ErrorViewProps) {
  return (
    <div className={cn("flex items-center justify-center min-h-[200px] p-4", className)}>
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <AlertTriangle className="mx-auto size-12 text-destructive" />
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">{message}</p>
        </CardContent>
        {onRetry && (
          <CardFooter className="justify-center">
            <Button onClick={onRetry}>重试</Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
