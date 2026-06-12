import React, { useState, useMemo } from 'react';
import { collection, addDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { Plus, Trash2, Image, X, ZoomIn } from 'lucide-react';

const categoryOptions = ['Ceremony', 'Reception', 'Pre-Wedding', 'Couple', 'Venue', 'Other'];

export default function PhotoGallery({ photos = [], db, basePath, storage, planId, showNotification, setConfirmModal }) {
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState('Other');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [filterCat, setFilterCat] = useState('');
  const [lightbox, setLightbox] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showNotification('Please select an image file.'); return; }
    if (file.size > 10 * 1024 * 1024) { showNotification('Image too large. Max 10MB.'); e.target.value = null; return; }
    setSelectedFile(file);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile || !storage || !planId || !db || !basePath) return;
    setUploading(true);
    setUploadProgress(0);

    const docRef = await addDoc(collection(db, `${basePath}/gallery`), {
      caption: caption || '',
      category,
      fileName: selectedFile.name,
      fileURL: '',
      filePath: '',
      createdAt: new Date().toISOString(),
    });

    const filePath = `plans/${planId}/gallery/${docRef.id}/${selectedFile.name}`;
    const fileRef = ref(storage, filePath);
    const task = uploadBytesResumable(fileRef, selectedFile);

    task.on('state_changed',
      snap => setUploadProgress(Math.round(snap.bytesTransferred / snap.totalBytes * 100)),
      err => {
        console.error(err);
        deleteDoc(doc(db, `${basePath}/gallery`, docRef.id));
        showNotification('Upload failed.');
        setUploading(false);
      },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        await setDoc(doc(db, `${basePath}/gallery`, docRef.id), { fileURL: url, filePath }, { merge: true });
        setCaption('');
        setCategory('Other');
        setSelectedFile(null);
        if (document.getElementById('gallery-file-input')) document.getElementById('gallery-file-input').value = '';
        setUploading(false);
        setUploadProgress(0);
        showNotification('Photo uploaded!');
      }
    );
  };

  const triggerDelete = (photo) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Photo?',
      message: `Delete "${photo.caption || photo.fileName}"? This cannot be undone.`,
      onConfirm: () => handleDelete(photo),
    });
  };

  const handleDelete = async (photo) => {
    try {
      if (photo.filePath) await deleteObject(ref(storage, photo.filePath)).catch(() => {});
      await deleteDoc(doc(db, `${basePath}/gallery`, photo.id));
      showNotification('Photo deleted.');
    } catch (e) {
      console.error(e);
      showNotification('Error deleting photo.');
    }
  };

  const filtered = useMemo(() => {
    const list = [...photos].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    return filterCat ? list.filter(p => p.category === filterCat) : list;
  }, [photos, filterCat]);

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-rose-900">Photo Gallery</h1>
          <p className="text-gray-600 mt-1">{photos.length} photo{photos.length !== 1 ? 's' : ''} uploaded</p>
        </div>
      </div>

      {/* Upload form */}
      <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
        <h2 className="text-lg font-semibold text-rose-800 mb-4">Add Photo</h2>
        <form onSubmit={handleUpload} className="flex flex-col md:flex-row gap-3 flex-wrap">
          <input
            type="text"
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="Caption (optional)"
            className="flex-1 min-w-[180px] p-2.5 rounded-lg border border-gray-300 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 text-sm"
          />
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="p-2.5 rounded-lg border border-gray-300 focus:border-rose-400 text-sm"
          >
            {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input
            type="file"
            id="gallery-file-input"
            accept="image/*"
            onChange={handleFileSelect}
            className="text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-rose-100 file:text-rose-700 hover:file:bg-rose-200 cursor-pointer"
            required
          />
          <button
            type="submit"
            disabled={uploading || !selectedFile}
            className="bg-rose-600 text-white px-5 py-2.5 rounded-lg hover:bg-rose-700 disabled:opacity-50 flex items-center gap-2 font-medium text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            {uploading ? `Uploading ${uploadProgress}%` : 'Upload'}
          </button>
        </form>
        {uploading && (
          <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-rose-500 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
          </div>
        )}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <span className="text-sm font-medium text-gray-600">Filter:</span>
        {['', ...categoryOptions].map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filterCat === cat ? 'bg-rose-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-rose-300'
            }`}
          >
            {cat || 'All'}
          </button>
        ))}
      </div>

      {/* Gallery grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-16 text-center">
          <Image className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium">No photos yet</p>
          <p className="text-gray-400 text-sm mt-1">Upload your first wedding photo above!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filtered.map(photo => (
            <div key={photo.id} className="relative group bg-white rounded-xl overflow-hidden shadow-md aspect-square">
              {photo.fileURL ? (
                <img
                  src={photo.fileURL}
                  alt={photo.caption || photo.fileName}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-rose-300 border-t-rose-600 rounded-full animate-spin" />
                </div>
              )}

              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end justify-between p-2 opacity-0 group-hover:opacity-100">
                <button
                  onClick={() => setLightbox(photo)}
                  className="text-white bg-black/50 p-1.5 rounded-lg hover:bg-black/70 transition-colors"
                  title="View full size"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => triggerDelete(photo)}
                  className="text-white bg-red-500/70 p-1.5 rounded-lg hover:bg-red-600 transition-colors"
                  title="Delete photo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Category badge */}
              <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="bg-rose-600/80 text-white text-xs px-2 py-0.5 rounded-full">{photo.category}</span>
              </div>

              {/* Caption */}
              {photo.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs font-medium truncate">{photo.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-white bg-black/50 p-2 rounded-full hover:bg-black/80"
            onClick={() => setLightbox(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <div className="relative max-w-4xl max-h-full" onClick={e => e.stopPropagation()}>
            <img
              src={lightbox.fileURL}
              alt={lightbox.caption || lightbox.fileName}
              className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain"
            />
            {(lightbox.caption || lightbox.category) && (
              <div className="mt-3 text-center">
                {lightbox.caption && <p className="text-white font-medium">{lightbox.caption}</p>}
                <p className="text-gray-400 text-sm mt-1">{lightbox.category}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
