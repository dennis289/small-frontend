/**
 * Shared form rules.
 *
 * A Vuetify rule is a function returning `true` or a message string. Keeping them
 * here rather than writing a lambda inline in every dialog does two things: the
 * same field asks for the same thing in the same words wherever it appears, and
 * those words are written for the person filling the form in rather than for the
 * developer who wrote it — "Enter an email address, like name@example.com", not
 * "invalid email".
 *
 * House style for messages:
 *   - Say what to do, not what went wrong: "Enter a first name", not "First name
 *     is missing". The field is already highlighted; the reader wants the fix.
 *   - Name the thing the way the label does, so the message and the label agree.
 *   - Show the shape when a format is involved. "Enter a phone number" leaves
 *     someone guessing whether the country code belongs there; the example doesn't.
 *   - No field names in code style, no "validation failed", no error codes.
 *
 * Every rule tolerates `null` and `undefined`, because a cleared Vuetify field
 * models as `null` rather than `''`, and a multi-select can be `null` before it is
 * ever opened.
 */

function isBlank (value) {
  return value === null || value === undefined || String(value).trim() === ''
}

/**
 * Something typed in. `what` completes the sentence "Enter …", so pass it with
 * the article: `required('a first name')`.
 */
export function required (what) {
  return value => !isBlank(value) || `Enter ${what}`
}

/**
 * Something picked from a list. Worth distinguishing from `required` — telling
 * someone to "enter" a value in a dropdown they can only choose from is the kind
 * of small wrongness that makes an app feel careless.
 */
export function chooseOne (what) {
  return value => !isBlank(value) || `Choose ${what}`
}

/**
 * Required only when something else is true — for a field that becomes mandatory
 * because of a sibling, like the password beside a username someone has started
 * filling in. Takes a predicate so it re-reads that sibling on every run.
 *
 * When the condition is false the field passes, which is the point: an optional
 * block stays optional until you begin using it.
 */
export function requiredIf (condition, what) {
  return value => !condition() || !isBlank(value) || `Enter ${what}`
}

/** At least one entry in a multi-select. */
export function atLeastOne (what) {
  return value => (Array.isArray(value) && value.length > 0) || `Choose at least one ${what}`
}

/**
 * Deliberately permissive: one @, no spaces, a dot in the domain. Anything
 * stricter starts rejecting addresses that really work, and the server checks it
 * properly anyway — this only exists to catch the typo before a round trip.
 */
export function email () {
  return value => isBlank(value)
    || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim())
    || 'Enter an email address, like name@example.com'
}

/**
 * Digits, spaces, dashes, brackets and a leading +, with 7–15 digits in it. Loose
 * on purpose — local and international formats both have to pass, and a rule that
 * argues with someone about their own phone number is worse than no rule.
 */
export function phone () {
  return value => {
    if (isBlank(value)) {
      return true
    }
    const raw = String(value).trim()
    if (!/^\+?[\d\s()-]+$/.test(raw)) {
      return 'Enter a phone number using digits only, like 0712 345 678'
    }
    const digits = raw.replace(/\D/g, '')
    return (digits.length >= 7 && digits.length <= 15)
      || 'Enter a phone number, like 0712 345 678'
  }
}

/** Minimum length, phrased as the requirement rather than the failure. */
export function minLength (n, what = 'This') {
  return value => isBlank(value)
    || String(value).length >= n
    || `${what} needs to be at least ${n} characters`
}

/**
 * Confirm-password style match. Takes a getter rather than a value so the rule
 * re-reads the other field each time it runs instead of closing over a stale one.
 */
export function matches (getOther, message = 'These two do not match') {
  return value => isBlank(value) || value === getOther() || message
}

/** A whole number no smaller than `min` — for counts like "how many people". */
export function wholeNumberAtLeast (min, what = 'This') {
  return value => {
    if (isBlank(value)) {
      return true
    }
    const n = Number(value)
    if (!Number.isInteger(n)) {
      return `${what} must be a whole number`
    }
    return n >= min || `${what} must be ${min} or more`
  }
}

/** Typed confirmation, as on the delete dialogs. */
export function mustType (expected) {
  return value => String(value ?? '').trim() === expected
    || `Type ${expected} to confirm`
}

/** A file has actually been chosen. Vuetify's file input models as a File or an array. */
export function fileChosen (what = 'a file') {
  return value => {
    const chosen = Array.isArray(value) ? value.length > 0 : !!value
    return chosen || `Choose ${what}`
  }
}

/**
 * End time strictly after start time. Both blank is fine — their own `required`
 * rules handle that — so this only fires when there is a real ordering to check.
 *
 * Compares the "HH:mm" strings the time picker produces, which sort correctly as
 * text, so no date parsing is needed.
 */
export function endAfterStart (getStart) {
  return value => {
    const start = getStart()
    if (isBlank(value) || isBlank(start)) {
      return true
    }
    return String(value) > String(start) || 'End time must be after the start time'
  }
}

/**
 * Validate a `v-form` ref and report the outcome the same way everywhere.
 *
 * `validate()` is what makes untouched fields show their errors — without it a
 * form that has never been typed in reports itself invalid while looking perfectly
 * clean, so pressing Save appears to do nothing at all. That silent dead button is
 * the specific failure this helper exists to prevent.
 *
 * A form ref that isn't mounted yet passes rather than blocking: the dialogs mount
 * their form lazily, and refusing to submit because a ref is momentarily null
 * would be a worse bug than the one being fixed.
 */
export async function validateForm (formRef) {
  const form = formRef?.value
  if (!form) {
    return true
  }
  const { valid } = await form.validate()
  return valid
}

/**
 * Turn whatever an API call threw into one sentence a person can act on.
 *
 * Three shapes arrive from the backend and only the first was ever shown:
 *
 *   {"error": "Someone on your team already has that email address."}
 *   {"email": ["Enter a valid email address."], "first_name": ["This field…"]}
 *   {"detail": "Authentication credentials were not provided."}
 *
 * The middle one is DRF reporting per-field problems, and it is the shape you get
 * for exactly the mistakes this module exists to catch. Reading only `.error`
 * meant every one of those became "Failed to save" — the app knew precisely what
 * was wrong and said nothing. Field messages are joined here instead, so the
 * reason survives the trip to the toast.
 *
 * DRF's own wording is kept as-is: it is already plain English. The one exception
 * is "This field may not be blank", which names no field once it is out of its
 * dictionary — so the key comes with it, tidied into words.
 */
export function readApiError (error, fallback = 'Something went wrong. Please try again.') {
  const data = error?.response?.data
  if (!data) {
    return fallback
  }
  if (typeof data === 'string') {
    return data
  }
  if (typeof data.error === 'string') {
    return data.error
  }
  if (typeof data.detail === 'string') {
    return data.detail
  }

  const messages = []
  for (const [field, value] of Object.entries(data)) {
    const text = Array.isArray(value) ? value.join(' ') : String(value)
    if (!text) {
      continue
    }
    // `non_field_errors` is about the record as a whole, so it reads correctly
    // on its own; anything else needs saying which field it is about.
    messages.push(
      field === 'non_field_errors' || field === 'detail'
        ? text
        : `${humanizeField(field)}: ${text}`,
    )
  }
  return messages.length > 0 ? messages.join(' ') : fallback
}

/** `first_name` → `First name`, so a field key can be shown to a reader. */
function humanizeField (field) {
  const words = String(field).replace(/_/g, ' ').trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}
