import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const videoId = params.id;
  
  // Mapping des vidéos
  const videoUrls: Record<string, string> = {
    'introduction.mp4': 'https://ntpqkpm4vpvltypf.public.blob.vercel-storage.com/introduction.mp4',
    'outro.mp4': 'https://ntpqkpm4vpvltypf.public.blob.vercel-storage.com/outro.mp4',
    'generique.mp4': 'https://ntpqkpm4vpvltypf.public.blob.vercel-storage.com/generique.mp4',
    // Ajouter les autres si nécessaire
  };
  
  const blobUrl = videoUrls[videoId];
  
  if (!blobUrl) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 });
  }
  
  try {
    // Fetch le fichier depuis Vercel Blob
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    
    // Déterminer le Content-Type correct
    const contentType = videoId.endsWith('.mp3') ? 'audio/mpeg' : 'video/mp4';
    
    // Retourner avec le bon Content-Type
    return new NextResponse(blob, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error proxying video:', error);
    return NextResponse.json({ error: 'Error loading video' }, { status: 500 });
  }
}

