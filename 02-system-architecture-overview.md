## Future Enhancements Considerations

### Custom Domain Mapping for Portals
- **Concept:** Allow event organizers to use their own custom domains or subdomains (e.g., `portal.theirevent.com`) for the various event-specific portals (Registration, Registrant, Abstract, Reviewer).
- **Purpose:** Enhance branding and provide a more seamless white-label experience for event organizers and their attendees.
- **High-Level Implementation Sketch:**
  - **Admin Panel Setting:** Organizers input their desired custom domain in the event configuration.
  - **DNS Configuration:** Organizers create a CNAME record in their DNS settings pointing their custom domain to a designated endpoint for the Atlas platform.
  - **Platform Hosting:** The Atlas hosting solution must support custom domain mapping and automated SSL certificate provisioning for these domains.
  - **Backend Mapping Logic:** The backend needs to identify the `event_id` associated with an incoming request based on the `Host` header (custom domain). This mapping would be stored in the database.
  - **Application Routing:** The application serves the correct portal and event context based on the resolved `event_id` from the custom domain.
- **Complexity:** Non-trivial. Involves DNS, SSL, hosting platform capabilities, and backend request routing logic.
- **Recommendation:** Implement as a future enhancement after core functionalities are stable. An MVP would serve all portals under the primary Atlas platform domain. 