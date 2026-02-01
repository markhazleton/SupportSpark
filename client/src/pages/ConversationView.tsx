import { Navbar } from "@/components/navbar";
import { useAuth } from "@/hooks/use-auth";
import { useConversation, useAddMessage } from "@/hooks/use-conversations";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { Loader2, Send, MessageSquare, ArrowLeft, UserCircle, Bold, Italic, Link as LinkIcon, Image, X } from "lucide-react";
import { useState, useRef } from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { useToast } from "@/hooks/use-toast";
import type { Message } from "@shared/schema";

export default function ConversationView() {
  const [match, params] = useRoute("/conversation/:id");
  const id = parseInt(params?.id || "0");
  const { user } = useAuth();
  const conversationQuery = useConversation(id);
  const conversation = conversationQuery.data as (typeof conversationQuery.data & { memberName?: string }) | null | undefined;
  const isLoading = conversationQuery.isLoading;
  const error = conversationQuery.error;
  const addMessageMutation = useAddMessage(id);
  const [replyContent, setReplyContent] = useState("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const isMember = user?.id === conversation?.memberId;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="w-8 h-8 text-primary animate-spin" data-testid="loading-spinner" />
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-stone-50">
        <h1 className="text-2xl font-bold text-stone-800">Update not found</h1>
        <Link href="/dashboard"><Button data-testid="button-return-home">Return Home</Button></Link>
      </div>
    );
  }

  const messages = conversation.data.messages || [];
  const sortedMessages = [...messages].sort((a: Message, b: Message) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  function insertMarkdown(prefix: string, suffix: string = prefix) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = replyContent.substring(start, end);
    const newText = replyContent.substring(0, start) + prefix + selectedText + suffix + replyContent.substring(end);
    setReplyContent(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append("images", file);
    });

    try {
      const res = await fetch(`/api/conversations/${id}/images`, {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const data = await res.json();
      setUploadedImages(prev => [...prev, ...data.images]);
      toast({
        title: "Images uploaded",
        description: `${data.images.length} image(s) ready to include in your message`
      });
    } catch (err) {
      toast({
        title: "Upload failed",
        description: "Could not upload images. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function removeImage(index: number) {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyContent.trim() && uploadedImages.length === 0) return;
    
    await addMessageMutation.mutateAsync({ 
      content: replyContent,
      images: uploadedImages.length > 0 ? uploadedImages : undefined
    });
    setReplyContent("");
    setUploadedImages([]);
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/dashboard">
          <Button variant="ghost" className="mb-6 pl-0 transition-all text-muted-foreground" data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Button>
        </Link>

        <article className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden mb-12">
          <div className="h-4 bg-primary/80 w-full" />
          <div className="p-8 md:p-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                {conversation.memberName?.charAt(0) || "M"}
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 leading-tight" data-testid="text-conversation-title">
                  {conversation.title}
                </h1>
                <div className="text-sm text-stone-500 mt-1 flex items-center gap-2 flex-wrap">
                  <span>By {conversation.memberName || "Member"}</span>
                  <span>•</span>
                  <span>{format(new Date(conversation.createdAt), "MMMM d, yyyy 'at' h:mm a")}</span>
                </div>
              </div>
            </div>

            <div className="prose prose-stone prose-lg max-w-none text-stone-700 leading-relaxed font-sans">
              {sortedMessages[0] && (
                <>
                  <ReactMarkdown>{sortedMessages[0].content}</ReactMarkdown>
                  {sortedMessages[0].images && sortedMessages[0].images.length > 0 && (
                    <div className="flex flex-wrap gap-4 mt-6 not-prose">
                      {sortedMessages[0].images.map((img: string, idx: number) => (
                        <img 
                          key={idx} 
                          src={img} 
                          alt={`Update image ${idx + 1}`}
                          className="rounded-lg max-h-80 object-cover border border-stone-200"
                          data-testid={`img-message-${idx}`}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </article>

        <section className="max-w-3xl mx-auto">
          <h3 className="text-xl font-bold mb-8 flex items-center gap-2 text-stone-800">
            <MessageSquare className="w-5 h-5 text-accent" />
            Words of Support <span className="text-stone-400 font-normal text-base">({sortedMessages.length - 1})</span>
          </h3>

          <div className="space-y-8 mb-12">
            {sortedMessages.slice(1).map((msg) => (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={cn(
                  "flex gap-4 p-6 rounded-xl border",
                  msg.authorId === user?.id 
                    ? "bg-white border-stone-200" 
                    : "bg-white border-stone-100"
                )}
                data-testid={`message-${msg.id}`}
              >
                <div className="shrink-0">
                  <div className="h-10 w-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-500">
                    <UserCircle className="w-6 h-6" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-2 gap-2 flex-wrap">
                    <span className="font-bold text-stone-900">{msg.authorName || "Supporter"}</span>
                    <span className="text-xs text-stone-400">
                      {format(new Date(msg.timestamp), "MMM d, h:mm a")}
                    </span>
                  </div>
                  <div className="prose prose-stone prose-sm max-w-none text-stone-600">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                  {msg.images && msg.images.length > 0 && (
                    <div className="flex flex-wrap gap-3 mt-4">
                      {msg.images.map((img: string, idx: number) => (
                        <img 
                          key={idx} 
                          src={img} 
                          alt={`Reply image ${idx + 1}`}
                          className="rounded-lg max-h-48 object-cover border border-stone-200"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {sortedMessages.length === 1 && (
              <div className="text-center py-12 text-stone-400 italic">
                No replies yet. Be the first to send support.
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border shadow-lg p-6 sticky bottom-6 md:static">
            <h4 className="font-bold text-stone-800 mb-4">Leave a message</h4>
            <form onSubmit={handleReply}>
              <div className="flex items-center gap-1 mb-2 border-b border-stone-100 pb-2">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon"
                  onClick={() => insertMarkdown("**")}
                  title="Bold"
                  data-testid="button-bold"
                >
                  <Bold className="w-4 h-4" />
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon"
                  onClick={() => insertMarkdown("*")}
                  title="Italic"
                  data-testid="button-italic"
                >
                  <Italic className="w-4 h-4" />
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon"
                  onClick={() => insertMarkdown("[", "](url)")}
                  title="Add Link"
                  data-testid="button-link"
                >
                  <LinkIcon className="w-4 h-4" />
                </Button>
                {isMember && (
                  <>
                    <div className="w-px h-5 bg-stone-200 mx-1" />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      title="Add Image"
                      data-testid="button-add-image"
                    >
                      {isUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Image className="w-4 h-4" />
                      )}
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      multiple
                      className="hidden"
                      onChange={handleImageUpload}
                      data-testid="input-image-upload"
                    />
                  </>
                )}
              </div>

              {uploadedImages.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {uploadedImages.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img 
                        src={img} 
                        alt={`Upload ${idx + 1}`}
                        className="w-16 h-16 object-cover rounded-md border border-stone-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        data-testid={`button-remove-image-${idx}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <Textarea
                ref={textareaRef}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a supportive message... (Markdown supported: **bold**, *italic*, [link](url))"
                className="mb-4 min-h-[100px] resize-none bg-stone-50 border-stone-200 focus:bg-white transition-colors"
                data-testid="input-reply-content"
              />
              <div className="flex justify-between items-center gap-4 flex-wrap">
                <p className="text-xs text-stone-400">
                  Your message will be visible to the community.
                </p>
                <Button 
                  type="submit" 
                  disabled={(!replyContent.trim() && uploadedImages.length === 0) || addMessageMutation.isPending}
                  className="bg-primary"
                  data-testid="button-send-message"
                >
                  {addMessageMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Send Message
                </Button>
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
