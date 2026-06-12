import React, { useState, useEffect } from 'react';
import { addDoc, collection, onSnapshot, updateDoc, doc, orderBy, query } from 'firebase/firestore';
import { db } from '../FirebaseTest.jsx';

const BlogManagement = () => {
  const [blogs, setBlogs] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: '',
    readTime: '',
    imageUrl: ''
  });

  useEffect(() => {
    const blogsQuery = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(blogsQuery, (querySnapshot) => {
      const blogsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBlogs(blogsData);
    });
    return () => unsubscribe();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = (blog) => {
    setEditingId(blog.id);
    setFormData({
      title: blog.title || '',
      excerpt: blog.excerpt || '',
      content: blog.content || '',
      category: blog.category || '',
      readTime: blog.readTime || '',
      imageUrl: blog.imageUrl || ''
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      title: '',
      excerpt: '',
      content: '',
      category: '',
      readTime: '',
      imageUrl: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const blogDoc = doc(db, 'blogs', editingId);
        await updateDoc(blogDoc, {
          ...formData,
          updatedAt: new Date()
        });
        alert('Blog post updated successfully!');
        handleCancel();
      } else {
        const docRef = await addDoc(collection(db, 'blogs'), {
          ...formData,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        alert('Blog post added successfully!');
        setFormData({
          title: '',
          excerpt: '',
          content: '',
          category: '',
          readTime: '',
          imageUrl: ''
        });
      }
    } catch (error) {
      console.error('Error saving blog post: ', error);
      alert('Error saving blog post');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Blog Management</h2>

      {/* Existing Blogs */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Existing Blog Posts</h3>
        {blogs.length === 0 ? (
          <p className="text-gray-500">No blog posts yet.</p>
        ) : (
          <div className="space-y-4">
            {blogs.map(blog => (
              <div key={blog.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">{blog.title}</h4>
                  <p className="text-sm text-gray-500">{blog.category} • {new Date(blog.createdAt?.toDate()).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => handleEdit(blog)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <h3 className="text-xl font-semibold text-gray-900 mb-6">{editingId ? 'Edit Blog Post' : 'Add New Blog Post'}</h3>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
          />
        </div>

        <div>
          <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-1">
            Excerpt
          </label>
          <textarea
            id="excerpt"
            name="excerpt"
            value={formData.excerpt}
            onChange={handleChange}
            required
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            Content
          </label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            required
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div>
             <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
               Category
             </label>
             <input
               type="text"
               id="category"
               name="category"
               value={formData.category}
               onChange={handleChange}
               required
               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
             />
           </div>

           <div>
             <label htmlFor="readTime" className="block text-sm font-medium text-gray-700 mb-1">
               Read Time (min)
             </label>
             <input
               type="number"
               id="readTime"
               name="readTime"
               value={formData.readTime}
               onChange={handleChange}
               required
               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
             />
           </div>
         </div>

         <div>
           <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
             Image URL (optional)
           </label>
           <input
             type="url"
             id="imageUrl"
             name="imageUrl"
             value={formData.imageUrl}
             onChange={handleChange}
             placeholder="https://example.com/image.jpg"
             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
           />
         </div>

        <div className="flex justify-end space-x-4">
          {editingId && (
            <button
              type="button"
              onClick={handleCancel}
              className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="bg-rose-600 text-white px-6 py-2 rounded-md hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
          >
            {editingId ? 'Update Blog Post' : 'Add Blog Post'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BlogManagement;