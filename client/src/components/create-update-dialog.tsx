import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateConversation } from "@/hooks/use-conversations";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Bold, Italic, Link, ImagePlus, X, Loader2 } from "lucide-react";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  initialMessage: z.string().min(1, "Message is required"),
});

export function CreateUpdateDialog() {
  const [open, setOpen] = useState(false);
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const createMutation = useCreateConversation();
  
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      initialMessage: "",
    },
  });

  const insertMarkdown = (before: string, after: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = form.getValues("initialMessage");
    const selectedText = text.substring(start, end);
    
    const newText = text.substring(0, start) + before + selectedText + after + text.substring(end);
    form.setValue("initialMessage", newText);
    
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length + after.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      const validExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      return validTypes.includes(file.type) && validExtensions.includes(ext) && file.size <= 5 * 1024 * 1024;
    });
    
    if (validFiles.length < files.length) {
      toast({
        title: "Some files skipped",
        description: "Only JPEG, PNG, GIF, WebP images under 5MB are allowed.",
        variant: "destructive",
      });
    }
    
    setPendingImages(prev => [...prev, ...validFiles].slice(0, 5));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setPendingImages(prev => prev.filter((_, i) => i !== index));
  };

  async function onSubmit(data: z.infer<typeof schema>) {
    try {
      setIsUploading(true);
      const result = await createMutation.mutateAsync(data);
      
      if (pendingImages.length > 0 && result?.id) {
        const formData = new FormData();
        pendingImages.forEach(file => formData.append("images", file));
        
        const uploadRes = await fetch(`/api/conversations/${result.id}/images`, {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        
        if (uploadRes.ok) {
          const { images } = await uploadRes.json();
          const imageMarkdown = images.map((url: string) => `![image](${url})`).join("\n");
          const updatedMessage = data.initialMessage + "\n\n" + imageMarkdown;
          
          await fetch(`/api/conversations/${result.id}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              content: updatedMessage, 
              images,
              isInitialUpdate: true 
            }),
            credentials: "include",
          });
          
          queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
        }
      }
      
      toast({
        title: "Update Published",
        description: "Your supporters will be notified.",
      });
      setOpen(false);
      form.reset();
      setPendingImages([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to publish update. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 shadow-lg hover:shadow-xl transition-all">
          <Plus className="w-4 h-4" />
          Post Update
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Share an Update</DialogTitle>
          <DialogDescription>
            Let your supporters know how you're doing.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g., Finding my footing this week" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="initialMessage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <div className="flex items-center gap-1 mb-2">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => insertMarkdown("**", "**")}
                      title="Bold"
                      data-testid="button-bold"
                    >
                      <Bold className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => insertMarkdown("*", "*")}
                      title="Italic"
                      data-testid="button-italic"
                    >
                      <Italic className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => insertMarkdown("[", "](url)")}
                      title="Link"
                      data-testid="button-link"
                    >
                      <Link className="w-4 h-4" />
                    </Button>
                    <div className="w-px h-6 bg-border mx-1" />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => fileInputRef.current?.click()}
                      title="Add images"
                      data-testid="button-add-images"
                    >
                      <ImagePlus className="w-4 h-4" />
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      multiple
                      className="hidden"
                      onChange={handleImageSelect}
                      data-testid="input-image-upload"
                    />
                  </div>
                  <FormControl>
                    <Textarea 
                      placeholder="Share your journey..." 
                      className="min-h-[150px] resize-none"
                      {...field}
                      ref={(e) => {
                        field.ref(e);
                        // TYPE12 FIX: Properly type the ref assignment
                        if (textareaRef && 'current' in textareaRef) {
                          textareaRef.current = e;
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                  
                  {pendingImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {pendingImages.map((file, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${index + 1}`}
                            className="w-16 h-16 object-cover rounded-md border"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"
                            data-testid={`button-remove-image-${index}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </FormItem>
              )}
            />
            
            <div className="flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || isUploading}>
                {(createMutation.isPending || isUploading) ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : "Publish Update"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
