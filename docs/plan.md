The Talent Mosaic: Product Requirements Document
Oct 21, 2026 · @PG
1. Overview
The Talent Mosaic is a private, peer-led community website and light CRM for HR professionals across startups, built and run by Mesa School of Business. Members use it to find peers, vendors, HR resources, jobs and events. The Mesa team uses it to see who is joining, who is connected, and who needs a follow-up.
This PRD defines what to build for production. A clickable prototype already exists (single page, sample data, no backend), and every requirement below reflects what was agreed and tested in it. Where something is still undecided, it is listed in Open questions (section 13) rather than assumed.
Item
Detail
Product
The Talent Mosaic Community
Tagline
A peer led community of HRs across startups
Built by
Mesa School of Business (shown in every page footer)
Audience
Approved community members (HR professionals at startups) and the Mesa community team
Access
Private, login required, member and admin roles
Status
Prototype complete with sample data; production build not started
Community contact
Firdose (WhatsApp and LinkedIn), shown under Have questions on Overview
Prototype
Talent Mosaic prototype
2. Problem, goals and non-goals
The community's value depends on relationships, but relationships are hard to see and hard to maintain without one shared system. The framing below is assumed from how the community runs today (WhatsApp, LinkedIn, spreadsheets) and should be confirmed.
Problems to solve
• Members cannot easily find the right peer, vendor, resource, job or event in one place.
• The team cannot tell who is engaged, who has never been contacted, and who is drifting away, so outreach is reactive.
• Membership data (city, role, seniority, interests, birthdays, owners) is scattered and often incomplete.
• Admin work (approvals, birthday messages, event hosting, profile changes) has no single queue.
Goals
#
Goal
How we will know
1
Give members one private place to discover people, vendors, resources, jobs and events
Monthly active members, search success, directory profile views
2
Make relationship coverage visible and actionable for the team
Share of members with a recent meaningful interaction, never-contacted count
3
Keep member data accurate with low admin effort
Data-quality gaps closed, profile change requests resolved quickly
4
Make events and hosting easy and safe
Event reach, repeat attendance, member-hosted sessions approved
5
Feel like a private professional community, not corporate HR software
Qualitative member feedback, consistent brand and tone
Non-goals for release 1
• A public website or public member directory.
• A chat or social feed. Conversation stays on WhatsApp and LinkedIn.
• Payment processing for paid events (price is shown, payment happens at the registration link).
• An HRIS, applicant tracking system or employer-side hiring tool.
• Native mobile apps (the site must work well on mobile browsers).
3. Users, roles and permissions
There are two logged-in experiences, member and admin, plus an owner assignment that lets admins split the relationship workload. Anything marked admin only must be hidden from members in the interface and blocked at the data layer.
Role
Who
Core permissions
Member
Approved HR professional
View directory, library, jobs and events; edit permitted profile fields (changes go to admin for review); suggest vendors and resources; host events (needs approval); receive notifications
Admin
Mesa community team
Everything a member can do, plus approvals, member records, tags, events attended, owners, Community Health, automations, integrations, user access, activity logs
Relationship owner
An admin assigned to a set of members
Sees their own members' health, follow-ups and history; logs interactions; owner is chosen per member by an admin
Vendor
Listed company
No login in release 1; appears as a Library entry maintained by admins
Visibility rules agreed in the prototype
Information
Members
Admins
New members over time chart and its member lists
Hidden
Visible
Community Health, engagement history, relationship owners
Hidden
Visible
Metric calculation explanations and detail toggles
Hidden
Visible
Full event venue address
City only
Full address
Other members' contact details
As each member allows (see open questions)
Full
Interaction logs and internal notes
Hidden
Visible
4. Scope
Release 1 covers all ten feature areas agreed for the CRM, with real login, a real database and real data imports replacing the prototype's sample data. Items marked later are specified in this document but not required for launch.
#
Feature area
Release 1
Later
1
User management
Secure login, member and admin roles, profile management, profile change requests
Single sign-on, per-field privacy controls
2
Community dashboard
Overview metrics, recent joiners, upcoming events, active opportunities
Personalised recommendations
3
Member directory
Search and filters, profiles, tags, member since
Real photographs, saved searches
4
Library and vendors
Vendor directory, HR resources, suggestions with admin approval
Vendor self-service, ratings
5
Job opportunities
Scraped HR job board with filters and apply links, listing refresh and expiry
Job alerts, member-posted jobs
6
Event management
Upcoming and past events, calendar, member hosting with approval, co-hosts, photos
Attendance check-in, in-app registration
7
Admin management
Member records, registrations, approvals, duplicates, owner assignment, tags, events attended
Bulk actions at scale
8
Data and integrations
Google Sheets and data imports, job feed, sync status and error monitoring
Additional connectors
9
Notifications and automations
In-app notifications, admin-approved birthday messages, follow-up digests
Automated WhatsApp sending
10
Search and activity monitoring
Global search by category, admin activity log
Advanced system monitoring
+
Community Health and Engagement
Full admin dashboard (section 8)
Forecasting, benchmarks
5. Information architecture and design rules
The site has five primary sections shared by everyone, plus an admin layer. Navigation is identical across all sections so members never have to relearn it.
Area
Purpose
Who sees it
Overview
Quick snapshot of the community and what needs attention
All
People
Discover members and connect with relevant professionals
All
Library
Vendor recommendations, HR resources, community knowledge
All
Opportunities
HR job openings from the job-scraping system
All
Events
Upcoming and past events and event information
All
Health
Community Health and Engagement, placed right after Events
Admin only
Admin menu
Admin Overview, Member Management, Submissions and Approvals, Data and Integrations, Automations, User Access, Activity Logs
Admin only
Header
• Top left: logo and The Talent Mosaic. Clicking it returns to Overview.
• Top right: Search, Notifications (action items and new events), user profile and settings, Logout.
• Profile and settings let members change only permitted fields. Changes notify an admin, who updates the record so it reflects on the profile.
Global design rules
• The community name, The Talent Mosaic, appears in the heading. Tagline: A peer led community of HRs across startups. The landing page greeting is Welcome to The Talent Mosaic Community.
• Footer on every page, including login: Built by Mesa School of Business.
• Colours: light green and white as primary, deep green for headings, icons and primary actions, white or very light neutral green backgrounds. Prototype tokens: deep teal #0B2E2A, forest #11403B, bright green #6ED190. Type: Playfair Display for headings, Manrope for body.
• Pill-shaped buttons, filters and tabs; no emoji on the login and landing pages.
• Tone: a private professional community, not corporate HR software.
• Layout must hold at 1280px with the admin item added, and work on mobile with a collapsed section menu.
• Every list has an empty state, a loading state and an error state.
6. Member experience requirements
6.1 Overview
Page title Overview, supporting line: Here's a quick snapshot of the Community. Metrics are calculated from underlying records, never typed in, and each card is clickable.
Metric
Shows
Click opens
Total members
Approved members
People directory
Cities represented
Cities with at least one member
City-filtered directory
Seniority distribution
Members across defined seniority levels
The matching member list
Current role
Representation across HR roles
Role-filtered directory
Recently joined
Most recent approvals, with the subtitle Members who joined us recently
Their profiles
Upcoming events
Count of upcoming events
Events section
Active opportunities
Current, valid job listings
Opportunities
The page also carries the global search (header: Looking for Something / Someone?), recent members, and a Have questions section with the community contact's WhatsApp and LinkedIn.
6.2 People
• Searchable directory with filters for startup, location, role, experience and interests.
• Profile shows role, startup, city, experience, HR function, expertise, interests, hobbies, LinkedIn, WhatsApp where permitted, tags and a live Member since X months label.
• Illustrated avatars for release 1; real photographs replace them once collected.
• Members edit permitted fields; edits are sent to admin for review before they appear.
6.3 Library
• Vendor directory with expandable cards: website, Instagram, WhatsApp (copy and open actions), email.
• HR resources and community knowledge, with a type filter whose default option reads Show All.
• Members can suggest vendors or resources; suggestions appear only after admin approval.
6.4 Opportunities
• Searchable HR job board fed by the job-scraping system, with filters, apply links and listing refresh.
• Listings expire or are removed when the source closes them; the Overview count reflects only valid listings.
6.5 Events
• Upcoming and past events, a calendar view, event details, registration link and photographs for past events.
• Host a session: any member can submit event name, location, date, time, format, details, registration link, and free or paid with a price. Co-hosts can be tagged.
• Hosted events need admin approval before publishing. Members see city only; admins see the full venue.
6.6 Search and notifications
• Global search covers name, startup, designation, location, HR function, expertise, interest, vendor, job title and event. Results are grouped by category and respect permissions.
• Notifications show action items and new events, for example an approved suggestion or a newly published event.
7. Admin requirements
Admins run the community from the same site. One rule applies everywhere: wherever an admin sees an option list or a record, they can add, edit and remove entries without engineering help.
Admin area
Requirements
Admin Overview
Community intelligence: totals, new members, pending approvals, items needing attention, data-quality gaps
Member Management
Edit any member record; review new registrations; spot and merge duplicates; assign or change the relationship owner from a dropdown; edit Events attended and Tags; filter members by tag
Submissions and Approvals
One queue for vendor and resource suggestions, member-hosted events, profile change requests and birthday messages; approve, edit, reject with a reason
Data and Integrations
Google Sheets and file imports, job-feed connection, last sync time, failed rows and error log, manual re-sync
Automations
Birthday messages and follow-up digests: choose when to send (day and time dropdowns), pause, and see run status
User Access
Invite or remove admins and relationship owners, set roles, deactivate members
Activity Logs
Who changed what and when, across member data, approvals, imports and settings
Specific behaviours
• Engagement tags: counts for Connected online only, Met in person, Attended 1 to 2 events and Regulars (3 or more events). Online only means the member has never attended an event. Admins can add free-text tags such as Speaker or Volunteer.
• Events attended: admins tick which events a member attended; counts and tags update live.
• Birthday messages: the system drafts a message and an admin approves it. At the time the admin chose, it opens a pre-filled WhatsApp link for the sender. Nothing is sent without approval.
• New members over time: monthly joins by approval date; clicking a month lists exactly who joined.
• Data quality: rows for missing LinkedIn, interests, hobbies, WhatsApp number, relationship owner and members who never logged in; each opens a list with inline fix-and-save fields.
• Every admin metric is clickable down to the member list behind it.
8. Community Health and Engagement dashboard
This admin-only page answers four questions: who is joining, who is actively connected to Mesa, who is becoming disengaged, and whom the team should reach out to next. It tracks relationship health as well as platform use, because a member may never log in yet still talk to the team or attend events.
Core rule: live denominators. Every metric is shown as n out of the actual number of approved members, with a percentage, calculated live. Example: Recently engaged = 20/66, 30.7%. When a filter or owner is applied, the denominator is that filtered group (for example 10/20 for one owner) and the count line says so.
Tabs
Tab
Contents
Overview
Eight clickable summary cards and the Members requiring attention lists
Outreach and Follow-ups
Prioritised queue with owner filter, snooze, mark contacted, reassign
Member Engagement
Member list filterable by status, owner and search, with live count line
Activity Timeline
Pick any member to see full history and log an interaction
Events and Participation
Reach, repeat attendance, never attended, by city, startup and seniority
Relationship Owners
Side-by-side comparison of every owner plus Unassigned; click an owner for their own view
Settings and Data
Interaction types, outcomes, thresholds, data-quality panel
Metric definitions
Group
Metric
Definition
Growth
Total approved members, new this month, monthly additions and growth rate
Counted from approval dates
Growth
Members by city, startup, experience; awaiting approval
Live from member records
Relationship
Contacted in last 30, 60, 90 days
Members with a meaningful recorded interaction in the window
Relationship
Never contacted
No meaningful interaction since joining
Relationship
Recent coverage
Share of members with a meaningful interaction in the last 90 days
Platform
Logged in last 30 days, returned multiple times
From login records; kept separate from offline engagement
Platform
Profile views, resources opened, event pages viewed, registrations started
From usage events
Events
Reach
Unique members who attended at least one event, out of all members
Events
Attendance rate, repeat vs first-time, never attended
Registered vs attended; counts per member
Interaction rules
• Interaction types (call, WhatsApp, meeting and so on) and outcomes are configured by admins: add, edit, remove.
• Outcomes decide whether an interaction is meaningful or only an attempt. A call with no response is an attempt and does not reset the contact clock.
• Reminder thresholds default to 30, 60 and 90 days and are adjustable in Settings.
Members requiring attention (six lists, each with count and View all)
1. Never contacted
2. Overdue follow-ups (crossing 30, 60, 90 days, or a promised follow-up left open)
3. Joined recently but not engaged
4. Previously engaged, now inactive
5. Never attended an event
6. Pending follow-up or unanswered request
Every number opens the members behind it, each member's history, and the next action, so no separate tracker is needed. Each metric also has a toggle that explains how it is calculated (admin only).
9. Data model and business rules
Every metric must be derivable from stored records, so the model keeps events, interactions and approvals as first-class data rather than counters.
Entity
Key fields
Notes
Member
Name, startup, designation, HR function, city, seniority, experience, expertise, interests, hobbies, LinkedIn, WhatsApp, email, birthday, status, approval date, relationship owner
Status: pending, approved, inactive; Member since is derived from approval date
User account
Email, role, last login, login count
Role: member or admin; owner is an admin attribute per member
Tag
Name, type (engagement or custom)
Many-to-many with member; admin managed
Vendor
Name, category, website, Instagram, WhatsApp, email, status
Created from admin entry or approved suggestion
Resource
Title, type, link or file, status
Type drives the Library filter
Job listing
Title, company, city, source URL, posted date, status, last seen
Expires when the source closes it
Event
Name, date, time, format, city, full venue, details, registration link, price, host, co-hosts, status, photos
Status: draft, pending approval, published, past
Attendance
Member, event, registered, attended
Source for events attended and reach
Interaction
Member, type, outcome, date, logged by, notes, follow-up date
Type and outcome come from admin-managed lists; outcome sets meaningful or attempt
Submission
Kind, submitter, payload, status, reviewer, reason
Covers suggestions, hosted events, profile changes
Automation
Kind, schedule, status, last run
Birthday messages, digests
Import run
Source, time, rows read, rows failed, errors
Feeds Data and Integrations
Activity log
Actor, action, object, before and after, time
Append only
Business rules
• Only approved members count in totals, directories and denominators.
• Meaningful contact resets the follow-up clock; an attempt does not.
• Members who never attended any event are tagged Connected online only; 1 to 2 attended events is the second tier; 3 or more is Regulars.
• Duplicate detection runs on email, WhatsApp number and name plus startup; admins decide merges.
• A member change to a permitted profile field creates a submission and leaves the live value unchanged until approved.
• Removing an interaction type or outcome that is in use must ask the admin how to remap existing records.
10. Automations, integrations and notifications
In the prototype these were described or simulated. For production, each needs real storage, a scheduler and a visible run status.
Item
Behaviour
Release 1
Birthday messages
Draft for each birthday, admin approves, admin chooses day and time from dropdowns, system opens a pre-filled WhatsApp link for the sender at that time
Yes, click-to-send only
Follow-up digest
Daily or weekly summary of overdue follow-ups per relationship owner
Yes, in-app and email
Member notifications
New events, approved suggestions, action items
Yes, in-app
Admin notifications
New registrations, pending submissions, member profile change requests
Yes, in-app and email
Google Sheets and file import
Map columns, validate rows, preview, import, report failed rows
Yes
Job feed
Scheduled scrape or feed pull, de-duplicate, expire closed jobs, error alert
Yes
Sync monitoring
Last run time, rows processed, errors, manual re-run
Yes
WhatsApp automated sending
Send through the business API without a manual click
Later
Every automation shows status (scheduled, running, succeeded, failed), last run and next run, and writes to the activity log.
11. Non-functional requirements
The site holds personal contact details and relationship notes for a private community, so privacy and access control come before convenience. Targets below are proposals to confirm with the engineering owner.
Area
Requirement
Privacy and consent
Members consent to what is shown in the directory and to being contacted; follow India's Digital Personal Data Protection Act; members can request correction or deletion; legal review before launch
Access control
Role checks enforced on the server, not only hidden in the interface; admin-only data never sent to member sessions
Security
HTTPS only, hashed credentials or managed identity provider, session expiry, rate limiting on login, no personal data in URLs, encrypted backups
Auditability
Append-only activity log for admin actions and data imports
Performance
Pages usable in under 3 seconds on a typical mobile connection; dashboards and drill-downs under 2 seconds at 1,000 members
Scale
Designed for hundreds to low thousands of members; no architecture needed beyond that for release 1
Accessibility
WCAG 2.1 AA: contrast on green and white palette, keyboard navigation, visible focus, labelled controls
Responsiveness
Works on current mobile and desktop browsers; nav verified at 1280px with the admin item
Reliability
Daily backups, restore tested before launch, import and scrape failures surfaced to admins
Data quality
Required fields validated; duplicates flagged; inline fix flows for missing data
Suggested stack
Next.js with shadcn/ui, matching the prototype's component style, over a managed Postgres database (recommendation, not a decision)
12. Success metrics
Success is judged on relationship coverage and member usefulness, not page views alone. All targets are proposals to confirm with the community team; none come from existing data.
Metric
Definition
Proposed target
Relationship coverage
Members with a meaningful interaction in the last 90 days, out of approved members
80% or higher within 3 months of launch
New member activation
New members with a meaningful interaction within 30 days of approval
90% or higher
Never-contacted members
Approved members with no meaningful interaction
Trend to zero
Monthly active members
Members who log in at least once in 30 days
40% or higher
Directory use
Profile views per active member per month
Track first, set target after 2 months
Event reach
Unique attendees out of all members
Track first, set target after 2 events
Repeat attendance
Attendees with 3 or more events out of all attendees
Track first
Data completeness
Members with LinkedIn, interests and owner filled
90% or higher
Approval turnaround
Submissions reviewed within 2 working days
90% or higher
Analytics events to capture from day one: login, profile view, search query and result click, resource open, job click-through, event page view, registration started, suggestion submitted, event hosted.
13. Release plan, risks and open questions
Build in four phases, each with a gate. Dates are not set because team size and start date are not yet decided.
Release phases
1. Foundation. Login and roles, member records, import from existing sheets, People directory, footer and branding. Gate: real member data loaded and reviewed by the community team.
2. Community surfaces. Overview, Library, Opportunities (job feed), Events with member hosting and approvals, global search, notifications. Gate: a pilot group of members uses it for two weeks.
3. Relationship management. Community Health dashboard, interaction logging, owners, follow-up queue, engagement tags, data-quality fixes, birthday automation. Gate: team stops using any side tracker.
4. Launch and tune. Privacy review, accessibility pass, backups tested, full member invite, metric baselines.
Risks
Risk
Impact
Mitigation
Interaction logging is skipped by the team
Health dashboard shows false gaps
Make logging a two-click action from the follow-up queue; weekly digest per owner
Member data incomplete or duplicated at import
Weak directory and wrong denominators
Import preview, duplicate review, data-quality drawers before launch
Job scraping breaks or violates source terms
Stale or risky listings
Check source terms, monitor failures, expiry rules, manual removal
Sensitive personal data exposed
Trust loss in a private community
Server-side role checks, consent, audit log, privacy review
Scope creep from admin-everything rule
Delayed launch
Admin-managed lists first for interaction types, outcomes, tags; defer the rest
Open questions
[ ] Real WhatsApp number and LinkedIn URL for Firdose (placeholders in the prototype)
[ ] Real member photographs, and consent to display them
[ ] Final engagement tag taxonomy beyond the four tiers and Speaker and Volunteer examples
[ ] How much contact detail members can see about each other, and whether members can opt out of the directory
[ ] Sign-in method: email link, password, or Google or LinkedIn login
[ ] Birthday messages: confirm click-to-send for release 1, and whether to move to the WhatsApp business API later
[ ] Job sources to scrape and the refresh frequency
[ ] Who the relationship owners are, and how many members each should hold
[ ] Hosting, domain and who owns the engineering build
[ ] Targets in section 12: confirm or replace
[ ] Whether paid events need on-site payment later