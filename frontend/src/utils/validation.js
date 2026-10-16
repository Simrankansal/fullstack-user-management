// Same rules as backend/utils/validators.js

const emailLooksValid = (trimmed) => {
  const basicPattern =
    /^[a-z0-9._%+-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

  if (!basicPattern.test(trimmed)) {
    return false;
  }

  const atIndex = trimmed.lastIndexOf("@");
  const local = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1).toLowerCase();

  if (local.length < 1 || local.length > 64) {
    return false;
  }

  if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) {
    return false;
  }

  const labels = domain.split(".");

  if (labels.length < 2) {
    return false;
  }

  const tld = labels[labels.length - 1];

  if (!/^[a-z]{2,}$/i.test(tld)) {
    return false;
  }

  for (const label of labels) {
    if (label.length < 2 || label.length > 63) {
      return false;
    }

    if (!/^[a-z0-9-]+$/i.test(label)) {
      return false;
    }

    if (label.startsWith("-") || label.endsWith("-")) {
      return false;
    }
  }

  return true;
};

export const validateEmail = (email) => {
  const trimmed = email.trim();

  if (!trimmed) {
    return "Email is required";
  }

  if (!emailLooksValid(trimmed)) {
    return "Please enter a valid email (e.g. name@gmail.com)";
  }

  return "";
};

export const validatePassword = (password, minLength = 6) => {
  if (!password) {
    return "Password is required";
  }

  if (password.length < minLength) {
    return `Password must be at least ${minLength} characters`;
  }

  return "";
};

export const validateName = (name) => {
  const trimmed = name.trim();

  if (!trimmed) {
    return "Name is required";
  }

  if (trimmed.length < 2) {
    return "Name must be at least 2 characters";
  }

  return "";
};
