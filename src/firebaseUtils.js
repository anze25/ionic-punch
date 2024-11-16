// firebaseUtils.js
import { getDocs, collection } from 'firebase/firestore';
import { db } from './firebaseConfig'; // Adjust the import according to your project structure

export const loadItemsFromFirebase = async (
  user,
  items,
  isLoading,
  loadingMessage
) => {
  isLoading.value = true;
  loadingMessage.value = 'Nalagam vpise...';

  try {
    if (!user) {
      console.error('No user is logged in.');
      return;
    }

    // Check if items are already in localStorage
    const cachedItems = localStorage.getItem('items');
    if (cachedItems) {
      items.value = JSON.parse(cachedItems);
      isLoading.value = false;
      return;
    }

    // Fetch items from Firebase
    const querySnapshot = await getDocs(collection(db, 'punches'));
    items.value = querySnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((item) => item.startTime && item.userId === user.uid) // Filter out items where startTime is null or empty and items not belonging to the logged-in user
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime)); // Sort items by startTime

    // Store items in localStorage
    localStorage.setItem('items', JSON.stringify(items.value));
  } catch (error) {
    console.error('Error fetching items from Firebase:', error);
  }

  isLoading.value = false;
};
