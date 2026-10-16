// Used in controllers before saving to MongoDB

const isValidEmail = (email) => {
  if (!email || typeof email !== "string") {
    return false;
  }

  const trimmed = email.trim().toLowerCase();

  const basicPattern =
    /^[a-z0-9._%+-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;

  if (!basicPattern.test(trimmed)) {
    return false;
  }

  const atIndex = trimmed.lastIndexOf("@");
  const local = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1);

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

  if (!/^[a-z]{2,}$/.test(tld)) {
    return false;
  }

  // Rejects invalid domains like user@l.com (single-letter label "l")
  for (const label of labels) {
    if (label.length < 2 || label.length > 63) {
      return false;
    }

    if (!/^[a-z0-9-]+$/.test(label)) {
      return false;
    }

    if (label.startsWith("-") || label.endsWith("-")) {
      return false;
    }
  }

  return true;
};

const isValidName = (name) => {
  const trimmed = name.trim();
  return trimmed.length >= 2;
};

module.exports = {
  isValidEmail,
  isValidName,
};
