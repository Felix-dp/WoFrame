function openTakes() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('kaijiang-media', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('takes');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function access(mode, operate) {
  const db = await openTakes();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction('takes', mode);
      const request = operate(transaction.objectStore('takes'));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    db.close();
  }
}

export function readTake(key) {
  return access('readonly', store => store.get(key));
}

export function writeTake(key, take) {
  return access('readwrite', store => store.put(take, key));
}

export function deleteTake(key) {
  return access('readwrite', store => store.delete(key));
}
