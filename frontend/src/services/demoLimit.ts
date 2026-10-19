// def callback function
type Listener = (message: string) => void;

// this will hold active subscriber callback
let listener: Listener | null = null;

// the toast component calls this to start listening
export function onDemoLimit(newListener: Listener) {
  listener = newListener;
  // return a function that stop listening (used on unmount)
  return () => {
    listener = null;
  };
}

// api.ts call this when  a demo limit response comes back
export function notifyDemoLimit(message: string) {
  if (listener) {
    listener(message);
  }
}
