// src/useFirebase.js
import { ref } from 'vue';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from './firebaseConfig';

export function useFirebase() {
  const items = ref([]);

  const fetchItems = async () => {
    const querySnapshot = await getDocs(collection(db, 'punches'));
    items.value = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  };

  const addItem = async (item) => {
    await addDoc(collection(db, 'punches'), item);
    fetchItems();
  };

  return {
    items,
    fetchItems,
    addItem,
  };
}
