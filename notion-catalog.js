/* DEWIFY Notion marketplace catalogue.
   Demo listings are intentionally not purchasable until real product content,
   Paddle price IDs and a secure entitlement/delivery flow are configured.
*/
window.DEWIFY_NOTION_CATALOG = {
  categories: [
    { name: "Business", keywords: ["operations", "founder", "finance", "management"] },
    { name: "Creators", keywords: ["content", "planning", "audience", "publishing"] },
    { name: "Game Development", keywords: ["game", "indie", "studio", "development"] },
    { name: "Digital Sellers", keywords: ["digital products", "store", "launch", "sales"] },
    { name: "Productivity", keywords: ["focus", "tasks", "planning", "habits"] },
    { name: "Student Life", keywords: ["study", "semester", "classes", "assignments"] },
    { name: "Personal Organization", keywords: ["life", "personal", "goals", "routines"] },
    { name: "Freelancers", keywords: ["clients", "projects", "proposals", "invoices"] }
  ],
  products: [
    {
      id: "business-os", slug: "business-os", name: "Business OS", category: "Business",
      description: "A central workspace for planning, operations and the moving parts of a small business.",
      longDescription: "Business OS is a demonstration listing for a founder-friendly workspace. It brings the common building blocks of a small operation into one structured home, with clear places for priorities, projects, routine processes and manual finance tracking.",
      price: null, originalPrice: null, currency: null, cover: "workspace",
      previewGallery: ["Business overview", "Projects and priorities", "Operations library"],
      features: ["A single home for current priorities", "Project and task views", "A simple manual finance tracker", "Space for repeatable processes"],
      includedResources: ["Business home dashboard", "Project and task board", "Goals and priorities page", "Finance tracker layout", "Process and notes library"],
      audience: ["Independent founders", "Small business owners", "Solo operators"],
      keywords: ["business planner", "operations", "founder", "finance", "small business", "dashboard"],
      featured: true, availability: "preview", demo: true, paddlePriceId: "", notionDuplicateUrl: "",
      deliveryInstructions: "A live release will provide a product-specific Notion duplication link after checkout."
    },
    {
      id: "creator-planner", slug: "creator-planner", name: "Creator Planner", category: "Creators",
      description: "Plan ideas, shape a publishing rhythm and keep content projects moving.",
      longDescription: "Creator Planner is a demonstration listing for creators who want one place to capture ideas, plan a content calendar, track production and review what is ready to publish.",
      price: null, originalPrice: null, currency: null, cover: "workspace",
      previewGallery: ["Creator dashboard", "Content calendar", "Idea library"],
      features: ["Idea capture and sorting", "A weekly content calendar", "Production status tracking", "Campaign and collaboration notes"],
      includedResources: ["Creator home page", "Content calendar", "Idea inbox", "Production board", "Campaign planner"],
      audience: ["Video creators", "Writers", "Streamers and independent publishers"],
      keywords: ["creator", "content calendar", "social media", "publishing", "audience", "video"],
      featured: true, availability: "preview", demo: true, paddlePriceId: "", notionDuplicateUrl: "",
      deliveryInstructions: "A live release will provide a product-specific Notion duplication link after checkout."
    },
    {
      id: "game-dev-hub", slug: "game-dev-hub", name: "Game Dev Hub", category: "Game Development",
      description: "Keep game concepts, milestones, builds and production notes in one studio workspace.",
      longDescription: "Game Dev Hub is a demonstration listing for small game teams and solo developers. The example structure follows a project from its concept and design notes through tasks, milestone planning and release preparation.",
      price: null, originalPrice: null, currency: null, cover: "workspace",
      previewGallery: ["Studio overview", "Development board", "Release checklist"],
      features: ["Game concept and design notes", "Milestone and task tracking", "Bug and feedback inbox", "Release preparation checklist"],
      includedResources: ["Studio dashboard", "Game design document outline", "Development board", "Milestone tracker", "Release checklist"],
      audience: ["Indie developers", "Small game studios", "Game jam teams"],
      keywords: ["game development", "indie game", "game design", "studio", "bugs", "release"],
      featured: true, availability: "preview", demo: true, paddlePriceId: "", notionDuplicateUrl: "",
      deliveryInstructions: "A live release will provide a product-specific Notion duplication link after checkout."
    },
    {
      id: "digital-seller-launchpad", slug: "digital-seller-launchpad", name: "Digital Seller Launchpad", category: "Digital Sellers",
      description: "Organize digital product ideas, launches, listings and post-launch tasks.",
      longDescription: "Digital Seller Launchpad is a demonstration listing for people building a small digital-product catalogue. It gives product research, listing preparation, launch tasks and improvement notes a shared structure.",
      price: null, originalPrice: null, currency: null, cover: "workspace",
      previewGallery: ["Seller dashboard", "Product pipeline", "Launch checklist"],
      features: ["Product idea and validation tracker", "Listing preparation workflow", "Launch calendar and tasks", "Post-launch notes and iteration list"],
      includedResources: ["Seller home dashboard", "Product pipeline", "Listing checklist", "Launch planner", "Improvement log"],
      audience: ["Digital product sellers", "Ebook publishers", "Template creators"],
      keywords: ["digital products", "seller", "launch", "storefront", "listing", "ebook"],
      featured: false, availability: "preview", demo: true, paddlePriceId: "", notionDuplicateUrl: "",
      deliveryInstructions: "A live release will provide a product-specific Notion duplication link after checkout."
    },
    {
      id: "focus-dashboard", slug: "focus-dashboard", name: "Focus Dashboard", category: "Productivity",
      description: "Bring daily priorities, tasks and personal projects into a calmer overview.",
      longDescription: "Focus Dashboard is a demonstration listing for people who want a lightweight personal planning space. The example layout separates today's priorities from longer-term projects and reference notes.",
      price: null, originalPrice: null, currency: null, cover: "workspace",
      previewGallery: ["Daily overview", "Task board", "Weekly review"],
      features: ["Daily priority list", "Simple project board", "Weekly review prompts", "Reference and notes area"],
      includedResources: ["Home dashboard", "Daily focus page", "Project board", "Weekly review template", "Notes library"],
      audience: ["Students", "Independent professionals", "People managing personal projects"],
      keywords: ["productivity", "focus", "tasks", "weekly planner", "habits", "personal projects"],
      featured: false, availability: "preview", demo: true, paddlePriceId: "", notionDuplicateUrl: "",
      deliveryInstructions: "A live release will provide a product-specific Notion duplication link after checkout."
    },
    {
      id: "semester-command-center", slug: "semester-command-center", name: "Semester Command Center", category: "Student Life",
      description: "Keep classes, assignment dates, study sessions and semester goals together.",
      longDescription: "Semester Command Center is a demonstration listing for students who want one overview of the academic term. The example structure includes course pages, an assignment tracker, study planning and a space for reference notes.",
      price: null, originalPrice: null, currency: null, cover: "workspace",
      previewGallery: ["Semester overview", "Assignment tracker", "Study planner"],
      features: ["Course and subject directory", "Assignment and due-date tracker", "Study session planning", "Semester goal overview"],
      includedResources: ["Semester dashboard", "Course directory", "Assignment tracker", "Study planner", "Notes and resources library"],
      audience: ["School students", "College students", "University students"],
      keywords: ["student", "semester", "study", "assignments", "classes", "exams", "college"],
      featured: false, availability: "preview", demo: true, paddlePriceId: "", notionDuplicateUrl: "",
      deliveryInstructions: "A live release will provide a product-specific Notion duplication link after checkout."
    },
    {
      id: "personal-life-organizer", slug: "personal-life-organizer", name: "Personal Life Organizer", category: "Personal Organization",
      description: "A practical home for personal goals, routines, plans and important notes.",
      longDescription: "Personal Life Organizer is a demonstration listing for everyday planning. It keeps personal projects, routines, goals and useful reference information in a single place without requiring a complicated productivity system.",
      price: null, originalPrice: null, currency: null, cover: "workspace",
      previewGallery: ["Life dashboard", "Goals and routines", "Personal library"],
      features: ["Personal goals and project list", "Routine and habit overview", "Planning and reflection prompts", "Reference notes library"],
      includedResources: ["Personal home dashboard", "Goals page", "Routine tracker", "Planning page", "Reference library"],
      audience: ["People organizing personal projects", "Busy professionals", "Anyone who prefers a single planning space"],
      keywords: ["personal", "life organizer", "goals", "routines", "habits", "planning"],
      featured: false, availability: "preview", demo: true, paddlePriceId: "", notionDuplicateUrl: "",
      deliveryInstructions: "A live release will provide a product-specific Notion duplication link after checkout."
    },
    {
      id: "freelance-client-desk", slug: "freelance-client-desk", name: "Freelance Client Desk", category: "Freelancers",
      description: "Track client work, project stages, proposals and delivery notes in one place.",
      longDescription: "Freelance Client Desk is a demonstration listing for independent service providers. The sample workspace creates a clear path from a new enquiry to active work, handoff and project wrap-up.",
      price: null, originalPrice: null, currency: null, cover: "workspace",
      previewGallery: ["Client overview", "Project pipeline", "Delivery notes"],
      features: ["Client and enquiry directory", "Project stage tracking", "Proposal and meeting notes", "Delivery and handoff checklist"],
      includedResources: ["Freelancer home page", "Client directory", "Project pipeline", "Proposal notes", "Delivery checklist"],
      audience: ["Freelance designers", "Developers", "Consultants and independent service providers"],
      keywords: ["freelancer", "client portal", "projects", "proposals", "consultant", "independent"],
      featured: false, availability: "preview", demo: true, paddlePriceId: "", notionDuplicateUrl: "",
      deliveryInstructions: "A live release will provide a product-specific Notion duplication link after checkout."
    }
  ],
  bundles: [
    {
      id: "complete-business-bundle", slug: "complete-business-bundle", name: "Complete Business Bundle",
      description: "A connected set of workspace previews for planning and running a small operation.",
      longDescription: "A demonstration collection pairing the Business OS with a focused workflow for organizing business projects, priorities and repeatable processes.",
      productIds: ["business-os", "freelance-client-desk", "digital-seller-launchpad"],
      features: ["A central business overview", "Client and project organization", "Digital product launch planning"],
      audience: ["Independent founders", "Small operators", "Digital-first businesses"],
      price: null, originalPrice: null, availability: "preview", demo: true
    },
    {
      id: "creator-essentials-bundle", slug: "creator-essentials-bundle", name: "Creator Essentials Bundle",
      description: "A creator planning set for ideas, content production and publishing.",
      longDescription: "A demonstration bundle that groups the Creator Planner with productivity and personal planning previews for a more connected creative routine.",
      productIds: ["creator-planner", "focus-dashboard", "personal-life-organizer"],
      features: ["Content planning and production", "A clear daily focus space", "Personal project organization"],
      audience: ["Independent creators", "Writers and publishers", "Small creative teams"],
      price: null, originalPrice: null, availability: "preview", demo: true
    },
    {
      id: "digital-entrepreneur-bundle", slug: "digital-entrepreneur-bundle", name: "Digital Entrepreneur Bundle",
      description: "A product-building workspace set from idea pipeline to business operations.",
      longDescription: "A demonstration bundle for people building digital products. It brings business planning, product workflow and launch organization into one collection.",
      productIds: ["business-os", "digital-seller-launchpad", "focus-dashboard"],
      features: ["Business planning", "Product catalogue organization", "Launch tasks and weekly priorities"],
      audience: ["Digital entrepreneurs", "Template and ebook sellers", "Solo founders"],
      price: null, originalPrice: null, availability: "preview", demo: true
    },
    {
      id: "student-productivity-bundle", slug: "student-productivity-bundle", name: "Student Productivity Bundle",
      description: "A student planning set for the semester, study sessions and everyday priorities.",
      longDescription: "A demonstration bundle pairing the Semester Command Center with a lightweight focus and personal organization preview.",
      productIds: ["semester-command-center", "focus-dashboard", "personal-life-organizer"],
      features: ["Course and assignment planning", "Daily study priorities", "Personal organization"],
      audience: ["School and college students", "University students", "Students managing multiple projects"],
      price: null, originalPrice: null, availability: "preview", demo: true
    }
  ]
};