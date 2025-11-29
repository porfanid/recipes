import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, ArrowLeft, Upload, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { z } from "zod";

const packagingIdeaSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().max(500).optional(),
  materials: z.array(z.string().min(1)).min(1, "At least one material is required"),
  steps: z.array(z.string().min(1)).min(1, "At least one step is required"),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

const EditPackagingIdea = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [materials, setMaterials] = useState([""]);
  const [steps, setSteps] = useState([""]);
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { data: idea, isLoading: ideaLoading } = useQuery({
    queryKey: ["packaging-idea", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packaging_ideas")
        .select("*")
        .eq("id", id!)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (idea) {
      setTitle(idea.title);
      setDescription(idea.description || "");
      setMaterials(idea.materials.length > 0 ? idea.materials : [""]);
      setSteps(idea.steps.length > 0 ? idea.steps : [""]);
      setImageUrl(idea.image_url || "");
      setImagePreview(idea.image_url || null);
    }
  }, [idea]);

  if (!user) {
    navigate("/auth");
    return null;
  }

  // Check if user is the author
  if (idea && idea.author_id !== user.id) {
    navigate("/my-packaging-ideas");
    return null;
  }

  const addMaterial = () => setMaterials([...materials, ""]);
  const removeMaterial = (index: number) => {
    if (materials.length > 1) {
      setMaterials(materials.filter((_, i) => i !== index));
    }
  };
  const updateMaterial = (index: number, value: string) => {
    const updated = [...materials];
    updated[index] = value;
    setMaterials(updated);
  };

  const addStep = () => setSteps([...steps, ""]);
  const removeStep = (index: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index));
    }
  };
  const updateStep = (index: number, value: string) => {
    const updated = [...steps];
    updated[index] = value;
    setSteps(updated);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, GIF, or WebP image.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadingImage(true);

    try {
      // Delete old uploaded image if exists (only if it's from our storage)
      if (imageUrl && imageUrl.includes('/recipe-images/')) {
        try {
          const urlParts = imageUrl.split('/recipe-images/');
          if (urlParts.length > 1) {
            const oldFilePath = urlParts[1];
            await supabase.storage.from('recipe-images').remove([oldFilePath]);
          }
        } catch {
          // Ignore errors when deleting old image
        }
      }

      // Upload file to Supabase Storage with user-specific folder
      const fileNameParts = file.name.split('.');
      const fileExt = fileNameParts.length > 1 ? fileNameParts.pop() : 'jpg';
      const filePath = `packaging/${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('recipe-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('recipe-images')
        .getPublicUrl(filePath);

      const newImageUrl = urlData.publicUrl;
      setImageUrl(newImageUrl);
      setImagePreview(newImageUrl);

      toast({
        title: "Image uploaded!",
        description: "Your image has been uploaded successfully.",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to upload image";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = async () => {
    if (!imageUrl || !user) return;

    // Only try to delete if it's from our storage
    if (imageUrl.includes('/recipe-images/')) {
      try {
        const urlParts = imageUrl.split('/recipe-images/');
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          await supabase.storage.from('recipe-images').remove([filePath]);
        }
      } catch {
        // Ignore errors when deleting image
      }
    }

    setImageUrl("");
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validated = packagingIdeaSchema.parse({
        title: title.trim(),
        description: description.trim() || undefined,
        materials: materials.filter(m => m.trim()),
        steps: steps.filter(s => s.trim()),
        imageUrl: imageUrl.trim() || undefined,
      });

      const { error } = await supabase
        .from("packaging_ideas")
        .update({
          title: validated.title,
          description: validated.description,
          materials: validated.materials,
          steps: validated.steps,
          image_url: validated.imageUrl,
          status: "pending",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id!)
        .eq("author_id", user.id);

      if (error) throw error;

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["packaging-idea", id] });
      queryClient.invalidateQueries({ queryKey: ["my-packaging-ideas"] });

      toast({
        title: "Idea updated!",
        description: "Your idea has been updated and is pending review.",
      });
      navigate("/my-packaging-ideas");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update idea";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (ideaLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <Skeleton className="h-8 w-20 mb-4" />
          <Card>
            <CardHeader>
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-5 w-full" />
            </CardHeader>
            <CardContent className="space-y-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="font-serif text-3xl font-semibold mb-4">Idea not found</h1>
          <Button onClick={() => navigate("/my-packaging-ideas")}>Back to my ideas</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => navigate("/my-packaging-ideas")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to My Ideas
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-3xl">Edit Packaging Idea</CardTitle>
            <CardDescription>
              Update your packaging repurposing idea. Changes will be reviewed by our admins before being published.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Turn Cardboard Boxes into Organizers"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A brief description of your repurposing idea..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Image (optional)</Label>
                <div className="space-y-4">
                  {imagePreview ? (
                    <div className="relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Idea preview"
                        className="max-w-full h-48 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={removeImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="idea-image-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                      >
                        {uploadingImage ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Image
                          </>
                        )}
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        JPEG, PNG, GIF, or WebP. Max 5MB.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Materials *</Label>
                {materials.map((material, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={material}
                      onChange={(e) => updateMaterial(index, e.target.value)}
                      placeholder="e.g., Cardboard box, Scissors, Glue"
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeMaterial(index)}
                      disabled={materials.length === 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addMaterial} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Material
                </Button>
              </div>

              <div className="space-y-3">
                <Label>Steps *</Label>
                {steps.map((step, index) => (
                  <div key={index} className="flex gap-2">
                    <Textarea
                      value={step}
                      onChange={(e) => updateStep(index, e.target.value)}
                      placeholder={`Step ${index + 1}: Cut the cardboard...`}
                      rows={2}
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeStep(index)}
                      disabled={steps.length === 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addStep} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Step
                </Button>
              </div>

              <div className="flex gap-4">
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Updating..." : "Update Idea"}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate("/my-packaging-ideas")}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditPackagingIdea;
