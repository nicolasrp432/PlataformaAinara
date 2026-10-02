import test from "node:test"
import assert from "node:assert/strict"
import { validateTestimonialUpload } from "../lib/community-testimonials.ts"

const valid = { fileName: "historia.mp4", mimeType: "video/mp4", size: 1024, width: 1080, height: 1920, duration: 45, caption: "Mi historia", consent: true, peopleAuthorization: true }

test("testimonial upload accepts a consented vertical video", () => {
  assert.deepEqual(validateTestimonialUpload(valid), [])
})

test("testimonial upload rejects unsafe media and missing permissions", () => {
  const errors = validateTestimonialUpload({ ...valid, mimeType: "application/octet-stream", size: 151 * 1024 * 1024, width: 1920, height: 1080, duration: 91, consent: false, peopleAuthorization: false })
  assert.ok(errors.some(error => error.includes("Formato")))
  assert.ok(errors.some(error => error.includes("150 MB")))
  assert.ok(errors.some(error => error.includes("vertical")))
  assert.ok(errors.some(error => error.includes("90 segundos")))
  assert.ok(errors.some(error => error.includes("consentimiento")))
  assert.ok(errors.some(error => error.includes("autorización")))
})
