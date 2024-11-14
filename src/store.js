import { defineStore } from 'pinia';

export const useItemsStore = defineStore('items', {
  state: () => ({
    items: [],
  }),
  actions: {
    setItems(newItems) {
      this.items = newItems;
    },
  },
  getters: {
    getItems: (state) => state.items,
  },
});
