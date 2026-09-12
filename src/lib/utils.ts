export type ClassValue = ClassArray | ClassDictionary | string | number | null | boolean | undefined;
export type ClassDictionary = Record<string, unknown>;
export type ClassArray = ClassValue[];

function toVal(mix: ClassValue): string {
  let str = "";
  if (typeof mix === "string" || typeof mix === "number") {
    str += String(mix);
  } else if (typeof mix === "object" && mix !== null) {
    if (Array.isArray(mix)) {
      for (let k = 0; k < mix.length; k++) {
        const val = toVal(mix[k]);
        if (val) {
          if (str) {
            str += " ";
          }
          str += val;
        }
      }
    } else {
      for (const k in mix) {
        if (Boolean((mix as ClassDictionary)[k])) {
          if (str) {
            str += " ";
          }
          str += k;
        }
      }
    }
  }
  return str;
}

export function cn(...inputs: ClassValue[]) {
  let str = "";
  for (let i = 0; i < inputs.length; i++) {
    const val = toVal(inputs[i]);
    if (val) {
      if (str) {
        str += " ";
      }
      str += val;
    }
  }
  return str;
}
