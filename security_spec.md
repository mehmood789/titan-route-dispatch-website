# Titan Route Dispatch LLC — Security Rules Specification

## 1. Data Invariants
1. Only a verified, authenticated administrator (`request.auth.token.email == 'info@trdispatch.us' && request.auth.token.email_verified == true` or explicit UID entry in `/admins/{uid}`) may read unpublished drafts (`/site_content/draft`), list or read carrier PII (`/carriers/{carrierId}`), list or read contact submissions (`/inquiries/{inquiryId}`), manage active loads (`/loads/{loadId}`), or mutate CMS content (`/site_content`, `/services`, `/pricing_plans`, `/testimonials`, `/media_assets`).
2. Public visitors may read `/site_content/published`, enabled `/services` (`resource.data.enabled == true`), `/pricing_plans`, `/testimonials`, and `/media_assets`.
3. Public visitors may submit new records to `/carriers/{carrierId}` and `/inquiries/{inquiryId}` ONLY when:
   - The document ID passes `isValidId()` (`^[a-zA-Z0-9_\-]+$`, `<= 128` chars).
   - Required fields and strict `keys().hasOnly(...)` schema bounds are satisfied (preventing shadow fields like `isAdmin: true`).
   - Initial workflow status is forced (`status == 'Pending Review'` for carriers; `status == 'Open'` for inquiries).
   - Submission timestamps strictly match `request.time`.
4. All array fields (`operatingRegions`, `documents`, `deliverables`, `limits`, `navItems`) are strictly bounded in size (`.size() <= 15`).

## 2. Dirty Dozen Adversarial Payloads (Must Return PERMISSION_DENIED)
1. Unauthenticated read of `/site_content/draft`.
2. Unauthenticated `list` or `get` on `/carriers` (PII protection).
3. Unauthenticated `list` or `get` on `/inquiries` (PII protection).
4. Unauthenticated `write` to `/site_content/published`, `/services`, `/pricing_plans`, `/testimonials`, `/media_assets`.
5. Spoofed admin login where `email == 'info@trdispatch.us'` but `email_verified == false`.
6. Authenticated non-admin (`other@gmail.com`) trying to update `/pricing_plans/standard`.
7. Public carrier registration attempting to set `status: 'Approved'` on creation.
8. Public carrier registration injecting shadow field `role: 'admin'` or `isAdmin: true`.
9. Public contact inquiry attempting to forge `createdAt` in the past or set `status: 'Resolved'`.
10. Document ID poisoning (`../admin/root` or 500-char string) on `/carriers/{carrierId}`.
11. Unbounded array injection (>15 regions or >10 documents) on `/carriers/{carrierId}`.
12. Authenticated non-admin trying to delete `/carriers/{carrierId}` or `/testimonials/{id}`.
