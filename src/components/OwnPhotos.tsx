import { createContext, useContext } from "react";

/** True when the machine photos in the app show this person's own gym. */
export const OwnPhotosContext = createContext(false);
export const useOwnPhotos = () => useContext(OwnPhotosContext);
