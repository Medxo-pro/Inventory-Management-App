'use client';

import { useState, useEffect } from 'react';
import { Grid, Box, Stack, Typography, Button, Modal, TextField, IconButton } from '@mui/material';
import { firestore } from '@/firebase'; // Make sure to import storage from your Firebase config
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  deleteDoc,
  getDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import { getStorage } from 'firebase/storage';
const storage = getStorage();

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'white',
  border: '2px solid #000',
  borderRadius: '8px',
  boxShadow: 24,
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
};

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [category, setCategory] = useState('');
  const [image, setImage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const updateInventory = async () => {
    try {
      const inventoryCollection = collection(firestore, 'inventory');
      const snapshot = await getDocs(query(inventoryCollection));
      const inventoryList = snapshot.docs.map((doc) => ({ name: doc.id, ...doc.data() }));
      setInventory(inventoryList);
    } catch (error) {
      console.error('Error updating inventory:', error);
    }
  };

  useEffect(() => {
    updateInventory();
  }, []);

  const handleImageUpload = async (file) => {
    try {
      const uniqueFileName = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `images/${uniqueFileName}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      return url;
    } catch (error) {
      console.error('Error uploading image:', error);
    }
    return '';
  };



  const addItem = async (item, quantity, category, imageUrl) => {
    try {
      const docRef = doc(collection(firestore, 'inventory'), item);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const { quantity: existingQuantity } = docSnap.data();
        await setDoc(docRef, { quantity: existingQuantity + quantity, category, imageUrl }, { merge: true });
      } else {
        await setDoc(docRef, { quantity, category, imageUrl });
      }
      await updateInventory();
      setItemName('');
      setQuantity(1);
      setCategory('');
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const removeItem = async (item) => {
    try {
      const docRef = doc(collection(firestore, 'inventory'), item);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const { quantity, category } = docSnap.data();
        if (quantity === 1) {
          await deleteDoc(docRef);
        } else {
          await setDoc(docRef, { quantity: quantity - 1, category });
        }
        await updateInventory();
      }
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setImage(null);
  };

  const filteredInventory = inventory.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = [...new Set(inventory.map((item) => item.category || 'Unknown'))];

  const handleImageChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setImage(event.target.files[0]);
      console.log('Image selected:', event.target.files[0]); // Debugging log
    }
  };

  const handleCameraCapture = (event) => {
    if (event.target.files && event.target.files[0]) {
      setImage(event.target.files[0]);
    }
  };

  const handleAddItem = async () => {
    console.log('handleAddItem called'); // Debugging log
    try {
      let imageUrl = '';
      if (image) {
        console.log('There is an image');
        imageUrl = await handleImageUpload(image);
      }
      await addItem(itemName, quantity, category, imageUrl);
      handleClose();
    } catch (error) {
      console.error('Error in handleAddItem:', error);
    }
  };

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      p={2}
      sx={{ backgroundImage: 'url(/background1.jpg)', backgroundSize: 'cover' }}
    >
      <Grid container spacing={2} sx={{ maxWidth: '1200px', width: '100%' }}>
        <Grid item xs={12} sm={4} md={3}>
          <Box
            display="flex"
            flexDirection="column"
            border="1px solid #333"
            borderRadius="8px"
            p={2}
            height="100%"
            overflow="auto"
            sx={{ backgroundColor: '#ffffffcc', alignItems: 'center', justifyContent: 'top' }}
          >
            <Typography variant="h5" color="#333" textAlign="center" mb={2}>
              Categories
            </Typography>
            <Stack spacing={1} alignItems="center">
              {categories.map((category) => (
                <Typography key={category} variant="body1" color="#333" textAlign="center">
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Typography>
              ))}
            </Stack>
          </Box>
        </Grid>
        <Grid item xs={12} sm={8} md={9}>
          <Box
            width="100%"
            bgcolor="#4CAF50"
            display="flex"
            justifyContent="center"
            alignItems="center"
            borderRadius="8px"
            mb={4}
            p={2}
          >
            <Typography variant="h4" color="#fff" textAlign="center">
              Inventory Management System
            </Typography>
          </Box>

          {/* Search Field */}
          <Box width="100%" mb={4}>
            <TextField
              label="Search"
              variant="outlined"
              fullWidth
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ borderRadius: '8px', backgroundColor: '#fff' }}
            />
          </Box>

          <Box
            display="flex"
            justifyContent="center"
            width="100%" // Ensure the container takes up full width if needed
            mb={4}
          >
            <Button
              variant="contained"
              onClick={handleOpen}
              sx={{
                width: '200px' // Adjust the width as needed
              }}
            >
              Add New Item
            </Button>
          </Box>

          {/* Inventory List */}
          <Box
            border="1px solid #333"
            borderRadius="8px"
            overflow="hidden"
            sx={{ backgroundColor: '#ffffffcc' }}
          >
            <Box
              width="100%"
              bgcolor="#4CAF50"
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              paddingX={1}
              borderRadius="0 0 8px 8px"
            >
              <Typography variant="h6" color="#fff" textAlign="center" flex="1">
                Name
              </Typography>
              <Typography variant="h6" color="#fff" textAlign="center" flex="1">
                Quantity
              </Typography>
              <Typography variant="h6" color="#fff" textAlign="center" flex="1">
                Category
              </Typography>
              <Typography variant="h6" color="#fff" textAlign="center" flex="1">
                Actions
              </Typography>
            </Box>
            <Box
              width="100%"
              height="300px" // Adjust height as needed
              overflow="auto"
              p={1}
              display="flex"
              flexDirection="column"
              alignItems="center"
            >
              <Stack spacing={0} width="100%" alignItems="center">
                {filteredInventory.map(({ name, quantity, category, imageUrl }) => (
                  <Box
                    key={name}
                    width="100%"
                    minHeight="150px"
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    bgcolor="#f0f0f0"
                    paddingX={2}
                    borderRadius="8px"
                    sx={{ transition: 'background-color 0.3s', '&:hover': { backgroundColor: '#e0e0e0' } }}
                  >
                    <Box display="flex" alignItems="center">
                      {imageUrl && (
                        <img src={imageUrl} alt={name} width="50" height="50" style={{ marginRight: '10px' }} />
                      )}
                      <Typography variant="h6" color="#333" textAlign="center">
                        {name.charAt(0).toUpperCase() + name.slice(1)}
                      </Typography>
                    </Box>
                    <Typography variant="h6" color="#333" textAlign="center">
                      {quantity}
                    </Typography>
                    <Typography variant="h6" color="#333" textAlign="center">
                      {category || 'Unknown'}
                    </Typography>
                    <Button variant="contained" onClick={() => removeItem(name)} sx={{ backgroundColor: '#f44336', '&:hover': { backgroundColor: '#d32f2f' } }}>
                      Remove
                    </Button>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Modal */}
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-title" variant="h6">
            Add Item
          </Typography>
          <Stack direction="column" spacing={2}>
            {/* Form Fields */}
            <TextField label="Item" variant="outlined" fullWidth value={itemName} onChange={(e) => setItemName(e.target.value)} />
            <TextField label="Quantity" variant="outlined" type="number" fullWidth value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} />
            <TextField label="Category" variant="outlined" fullWidth value={category} onChange={(e) => setCategory(e.target.value)} />
            {/* File Upload Buttons */}
            <input accept="image/*" style={{ display: 'none' }} id="upload-button-file" type="file" onChange={handleImageChange} />
            <label htmlFor="upload-button-file">
              <Button variant="contained" component="span">Upload Image</Button>
            </label>
            <input accept="image/*" style={{ display: 'none' }} id="camera-button-file" type="file" capture="environment" onChange={handleCameraCapture} />
            <label htmlFor="camera-button-file">
              <IconButton color="primary" aria-label="capture picture" component="span">
                <PhotoCamera />
              </IconButton>
            </label>
            <Button variant="contained" onClick={handleAddItem}>Add</Button>
          </Stack>
        </Box>
      </Modal>
    </Box>
  );


}
