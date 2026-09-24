import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ImagePlus, X } from 'lucide-react';
import { toast } from 'sonner';
import ProfileSection from './ProfileSection';

export default function ProfilePhotoSection({ photos, onChange }) {
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const uploaded = await Promise.all(
        files.map(file => base44.integrations.Core.UploadPublicFile({ file }))
      );
      onChange([...photos, ...uploaded.map(r => r.file_url)]);
      toast.success('Photo added');
    } catch {
      toast.error('Upload failed');
    }
    setUploading(false);
    e.target.value = '';
  };

  return (
    <ProfileSection title="Photos">
      <p className="text-xs text-muted-foreground mb-3">The first photo is used as the profile picture.</p>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {photos.map((url, i) => (
          <div key={`${url}-${i}`} className="relative group aspect-square rounded-lg overflow-hidden border border-border">
            <img src={url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onChange(photos.filter((_, idx) => idx !== i))}
            >
              <X className="h-3 w-3" />
            </Button>
            {i === 0 && (
              <span className="absolute bottom-0 left-0 right-0 bg-primary/90 text-primary-foreground text-[10px] text-center py-0.5">
                Profile
              </span>
            )}
          </div>
        ))}

        <label className="aspect-square rounded-lg border border-dashed border-border flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-muted/50">
          <ImagePlus className="h-5 w-5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{uploading ? 'Uploading...' : 'Add photo'}</span>
          <input type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} disabled={uploading} />
        </label>
      </div>
    </ProfileSection>
  );
}