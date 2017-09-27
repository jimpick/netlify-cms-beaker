import semaphore from "semaphore";
import AuthenticationPage from "./AuthenticationPage";
import { fileExtension } from "../../lib/pathHelper";
import AssetProxy from "../../valueObjects/AssetProxy";

const MAX_CONCURRENT_DOWNLOADS = 1;
const MAX_CONCURRENT_UPLOADS = 1;

const origin = document.location.origin;
const archive = window.DatArchive ? new DatArchive(document.location.origin) : null;

export default class Beaker {
  constructor(config) {
    this.config = config;
  }

  setUser() {}

  authComponent() {
    return AuthenticationPage;
  }

  authenticate(state) {
    return Promise.resolve({ email: 'beaker@example.com', name: 'beaker' });
  }

  logout() {
    return null;
  }

  getToken() {
    return Promise.resolve('');
  }

  entriesByFolder(collection, extension) {
    const entries = [];
    const folder = collection.get('folder');
    const promise = archive.readdir(folder)
      .then(files => files.filter(file => fileExtension(file) === extension))
      .then(this.fetchFiles(folder));
    return promise
  }

  entriesByFiles(collection) {
    /* FIXME */
    console.error('Missing implemention for entriesByFiles', collection);
  }

  fetchFiles = (folder) => (files) => {
    const sem = semaphore(MAX_CONCURRENT_DOWNLOADS);
    const promises = [];
    files.forEach((file) => {
      promises.push(new Promise((resolve, reject) => {
        const path = `${folder}/${file}`
        return sem.take(() => archive.readFile(path).then((data) => {
          resolve({
            file: {
              name: file,
              path
            },
            data
          });
          sem.leave();
        }).catch((err) => {
          sem.leave();
          reject(err);
        }))
      }));
    });
    return Promise.all(promises);
  }

  getEntry(collection, slug, path) {
    return archive.readFile(path).then(data => ({ file: { path }, data }));
  }

  persistEntry(entry, mediaFiles = [], options) {
    // FIXME: Might not work if directory doesn't exist
    const promise = archive.writeFile(entry.path, entry.raw)
      .then(this.uploadMediaFiles(mediaFiles))
      .then(() => {
        archive.commit();
      });
    return promise;
  }

  uploadMediaFiles = (files) => () => {
    const sem = semaphore(MAX_CONCURRENT_DOWNLOADS);
    const promises = [];
    files.forEach((file) => {
      promises.push(new Promise((resolve, reject) => {
        const content = file instanceof AssetProxy ? file.toBase64() : this.toBase64(file.raw);
        const promise = sem.take(
          () => content
          .then(contentBase64 => archive.writeFile(file.path, contentBase64, 'base64'))
          .then(() => {
            resolve();
            sem.leave();
          })
          .catch((err) => {
            sem.leave();
            reject(err);
          })
        );
        return promise;
      }));
    });
    return Promise.all(promises);
  }

  deleteFile(path, commitMessage) {
    const promise = archive.unlink(path)
      .then(() => { archive.commit() });
    return promise;
  }
}
