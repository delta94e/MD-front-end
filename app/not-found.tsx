import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center space-y-4">
        <FileQuestion className="h-16 w-16 text-muted-foreground mx-auto" />
        <div>
          <h1 className="text-2xl font-bold">404</h1>
          <p className="text-muted-foreground mt-1">Page not found</p>
        </div>
        <Button variant="outline" render={<Link href="/" />}>
          <Home className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
      </div>
    </div>
  );
}
