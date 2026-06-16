import {
  Component,
  ElementRef,
  ViewChild,
  ViewChildren,
  QueryList,
  AfterViewInit,
  OnInit,
  OnDestroy,
  inject,
  NgZone,
  PLATFORM_ID,
  signal,
  effect,
} from "@angular/core";
import { CommonModule, isPlatformBrowser } from "@angular/common";
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";
import { TranslateModule } from "@ngx-translate/core";
import { gsap } from "gsap";

interface Project {
  titleKey: string;
  categoryKey: string;
  year: string;
  videoUrl: string;
  descriptionKey: string;
  color: string;
}

@Component({
  selector: "app-portfolio",
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: "./portfolio.component.html",
  styleUrl: "./portfolio.component.scss",
})
export class PortfolioComponent implements OnInit, AfterViewInit, OnDestroy {
  private sanitizer = inject(DomSanitizer);
  private ngZone = inject(NgZone);
  private platformId = inject(PLATFORM_ID);

  @ViewChildren("spiralCard") cardElements!: QueryList<
    ElementRef<HTMLDivElement>
  >;
  @ViewChild("carouselWorld") carouselWorldEl!: ElementRef<HTMLDivElement>;
  @ViewChild("projectsSection") projectsSectionEl!: ElementRef<HTMLDivElement>;
  @ViewChildren("listVideo") listVideos!: QueryList<
    ElementRef<HTMLVideoElement>
  >;

  constructor() {
    effect(() => {
      const expandedIdx = this.expandedIndex();
      // Ensure we query and control videos after the DOM updates
      requestAnimationFrame(() => {
        const videos = this.listVideos?.toArray();
        if (!videos) return;

        videos.forEach((videoRef, idx) => {
          const video = videoRef.nativeElement;
          if (idx === expandedIdx) {
            video.play().catch((err) => {
              console.warn("Playback prevented:", err);
            });
          } else {
            video.pause();
            video.currentTime = 0;
          }
        });
      });
    });
  }

  // View state: 'spiral' | 'list'
  viewMode = signal<"spiral" | "list">("spiral");

  projects: Project[] = [
    {
      titleKey: "PORTFOLIO.SERVICES.AI_AGENTS.TITLE",
      categoryKey: "PORTFOLIO.CATEGORIES.AUTOMATION",
      year: "2026",
      videoUrl: "assets/videos/n8n_workflow_run_4K.mp4",
      descriptionKey: "PORTFOLIO.SERVICES.AI_AGENTS.DESCRIPTION",
      color: "#6366F1",
    },
    {
      titleKey: "PORTFOLIO.SERVICES.DOC_PROCESSING.TITLE",
      categoryKey: "PORTFOLIO.CATEGORIES.AUTOMATION",
      year: "2026",
      videoUrl: "assets/videos/doc-processing.mp4",
      descriptionKey: "PORTFOLIO.SERVICES.DOC_PROCESSING.DESCRIPTION",
      color: "#3B82F6",
    },
    {
      titleKey: "PORTFOLIO.SERVICES.LEAD_SCRAPING.TITLE",
      categoryKey: "PORTFOLIO.CATEGORIES.AUTOMATION",
      year: "2026",
      videoUrl: "assets/videos/video.mp4",
      descriptionKey: "PORTFOLIO.SERVICES.LEAD_SCRAPING.DESCRIPTION",
      color: "#10B981",
    },
    {
      titleKey: "PORTFOLIO.SERVICES.CRM_SYNC.TITLE",
      categoryKey: "PORTFOLIO.CATEGORIES.AUTOMATION",
      year: "2026",
      videoUrl: "assets/videos/video.mp4",
      descriptionKey: "PORTFOLIO.SERVICES.CRM_SYNC.DESCRIPTION",
      color: "#F59E0B",
    },
    {
      titleKey: "PORTFOLIO.SERVICES.CUSTOMER_SUPPORT.TITLE",
      categoryKey: "PORTFOLIO.CATEGORIES.AUTOMATION",
      year: "2026",
      videoUrl: "assets/videos/video.mp4",
      descriptionKey: "PORTFOLIO.SERVICES.CUSTOMER_SUPPORT.DESCRIPTION",
      color: "#EC4899",
    },
    {
      titleKey: "PORTFOLIO.SERVICES.FINANCIAL_REPORTING.TITLE",
      categoryKey: "PORTFOLIO.CATEGORIES.AUTOMATION",
      year: "2026",
      videoUrl: "assets/videos/video.mp4",
      descriptionKey: "PORTFOLIO.SERVICES.FINANCIAL_REPORTING.DESCRIPTION",
      color: "#8B5CF6",
    },
    {
      titleKey: "PORTFOLIO.SERVICES.SEO_AIO_AUDIT.TITLE",
      categoryKey: "PORTFOLIO.CATEGORIES.OPTIMIZATION",
      year: "2026",
      videoUrl: "assets/videos/video.mp4",
      descriptionKey: "PORTFOLIO.SERVICES.SEO_AIO_AUDIT.DESCRIPTION",
      color: "#EF4444",
    },
    {
      titleKey: "PORTFOLIO.SERVICES.WEB_DEV.TITLE",
      categoryKey: "PORTFOLIO.CATEGORIES.DEVELOPMENT",
      year: "2026",
      videoUrl: "assets/videos/responsive_inspector_4K.mp4",
      descriptionKey: "PORTFOLIO.SERVICES.WEB_DEV.DESCRIPTION",
      color: "#06B6D4",
    },
  ];

  // Hover variables
  hoveredVideo: SafeUrl | null = null;
  hoveredIndex = signal<number | null>(null);
  mouseX = 0;
  mouseY = 0;
  tiltMouseX = 0;
  tiltMouseY = 0;

  // Accordion drawer variables for list/mobile mode
  expandedIndex = signal<number | null>(null);
  isMuted = signal<boolean>(true);

  // 3D physics & scrolling variables
  scrollValue = 0;
  targetScrollValue = 0;
  activeProjectIndex = signal<number>(0);

  // Dragging states
  isDragging = false;
  startY = 0;
  startScrollVal = 0;

  private animationFrameId: number | null = null;
  private revealFinished = false;

  // Listeners list to destroy later
  private resizeListener?: () => void;
  private eventCleanup: Array<() => void> = [];

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Listen for custom intro event to trigger fly-in intro animation
      window.addEventListener("intro-finished", this.onIntroFinished);
    }
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.ngZone.runOutsideAngular(() => {
        this.setupPhysicsLoop();
        this.setupEventListeners();
      });
    }
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener("intro-finished", this.onIntroFinished);
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
      this.eventCleanup.forEach((clean) => clean());
    }
  }

  // Handle fly-in entry animation
  private onIntroFinished = () => {
    this.revealFinished = true;
    // Animate the rotation and radius into place
    gsap.fromTo(
      this,
      { targetScrollValue: -3 },
      {
        targetScrollValue: 0,
        duration: 1.8,
        ease: "power3.out",
      },
    );
  };

  private setupPhysicsLoop() {
    const tick = () => {
      // Linear interpolation (LERP) for physics smoothness
      const lerpFactor = 0.085;
      this.scrollValue +=
        (this.targetScrollValue - this.scrollValue) * lerpFactor;

      // Wrap scroll value within projects length boundaries
      const numProjects = this.projects.length;

      // Determine active card based on closest scroll value
      const rawActive = Math.round(this.scrollValue);
      const activeIdx = ((rawActive % numProjects) + numProjects) % numProjects;

      if (this.activeProjectIndex() !== activeIdx) {
        this.ngZone.run(() => {
          this.activeProjectIndex.set(activeIdx);
        });
      }

      if (this.viewMode() === "spiral") {
        this.updateSpiralTransforms();
      }

      this.animationFrameId = requestAnimationFrame(tick);
    };

    this.animationFrameId = requestAnimationFrame(tick);
  }

  private updateSpiralTransforms() {
    const cards = this.cardElements.toArray();
    if (cards.length === 0) return;

    const numCards = cards.length;
    // Trigonometric spiral angles
    const angleStep = 0.85; // ~48 degrees separation in 3D helix
    const yStep = 130; // vertical gap

    // Screen responsiveness check
    const width = window.innerWidth;
    let radius = 520;
    let depthOffset = 450;
    if (width < 768) {
      radius = 260;
      depthOffset = 210;
    } else if (width < 1200) {
      radius = 400;
      depthOffset = 340;
    }

    cards.forEach((cardRef, i) => {
      const el = cardRef.nativeElement;

      // Compute relative spiral offset based on target scroll value
      let relativeOffset = i - this.scrollValue;

      // Wrap relative offset to make the spiral loop infinitely [-numCards/2, numCards/2]
      relativeOffset = (relativeOffset + numCards / 2) % numCards;
      if (relativeOffset < 0) {
        relativeOffset += numCards;
      }
      relativeOffset -= numCards / 2;

      const angle = relativeOffset * angleStep;

      // Coordinates
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius - depthOffset;
      const y = relativeOffset * yStep;

      // Rotations: Face the camera (invert angle) + custom tilt on hover
      let rotY = angle * (180 / Math.PI);
      let rotX = 0;
      let rotZ = 0;

      // Hover card tilt parallax effect
      if (this.hoveredIndex() === i) {
        // Subtle interactive mouse offset
        rotX = -this.tiltMouseY * 12;
        rotY += this.tiltMouseX * 12;
      }

      // Calculate distance/depth opacity fade
      let opacity = 1;
      if (z < -800) {
        opacity = Math.max(0, 1 - Math.abs(z + 800) / 450);
      } else if (z > 140) {
        // Fly-past-screen fade out
        opacity = Math.max(0, 1 - (z - 140) / 180);
      }

      // Scale card slightly if close
      const baseScale = 1.0;
      const focusMultiplier = this.hoveredIndex() === i ? 1.05 : 1.0;

      el.style.transform = `translate3d(${x}px, ${y}px, ${z}px) rotateY(${rotY}deg) rotateX(${rotX}deg) rotateZ(${rotZ}deg) scale(${baseScale * focusMultiplier})`;
      el.style.opacity = opacity.toString();

      // Turn off interactions for cards that are too deep or behind screen
      // Tighter cutoff for mobile to ensure the jump is hidden
      const hideZCutoff = width < 768 ? -220 : -350;
      if (z < hideZCutoff || z > 250) {
        el.style.pointerEvents = "none";
        el.style.visibility = "hidden";
      } else {
        el.style.pointerEvents = "auto";
        el.style.visibility = "visible";
      }
    });
  }

  private setupEventListeners() {
    if (!this.projectsSectionEl) return;
    const scrollEl = this.projectsSectionEl.nativeElement;

    const handleWheel = (e: WheelEvent) => {
      if (this.viewMode() !== "spiral") return;

      // Capture wheel event strictly inside .bg-title-track OR over any of the cards (.spiral-card)
      const target = e.target as HTMLElement;
      const insideTitleTrack = target.closest(".bg-title-track");
      const insideCard = target.closest(".spiral-card");

      if (!insideTitleTrack && !insideCard) {
        return; // Let standard page scrolling handle it
      }

      // Prevent page scrolling when inside target scroll regions
      e.preventDefault();

      // Update target position
      const scrollSpeed = 0.0015;
      this.targetScrollValue += e.deltaY * scrollSpeed;
    };

    // Dragging gestures (Mouse)
    const handleMouseDown = (e: MouseEvent) => {
      if (this.viewMode() !== "spiral") return;

      // Skip dragging on clicking interactive elements/buttons
      if ((e.target as HTMLElement).closest(".view-toggle, button, a")) return;

      this.isDragging = true;
      this.startY = e.clientY;
      this.startScrollVal = this.targetScrollValue;
      document.body.style.cursor = "grabbing";
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Record mouse coordinates inside viewport (normalized -0.5 to 0.5) for card tilt
      const rect = window.innerWidth;
      const rectH = window.innerHeight;
      this.tiltMouseX = e.clientX / rect - 0.5;
      this.tiltMouseY = e.clientY / rectH - 0.5;

      if (this.viewMode() !== "spiral") return;

      // Safety guard: If mouse button is released outside window or context, cancel dragging state
      if (e.buttons !== 1 && this.isDragging) {
        this.isDragging = false;
        document.body.style.cursor = "default";
        return;
      }

      if (!this.isDragging) return;

      const deltaY = e.clientY - this.startY;
      const dragSensitivity = 0.005;
      this.targetScrollValue = this.startScrollVal - deltaY * dragSensitivity;
    };

    const handleMouseUp = () => {
      if (!this.isDragging) return;
      this.isDragging = false;
      document.body.style.cursor = "default";
    };

    // Touch support (Mobile)
    const handleTouchStart = (e: TouchEvent) => {
      if (this.viewMode() !== "spiral" || e.touches.length === 0) return;
      if ((e.target as HTMLElement).closest(".view-toggle, button, a")) return;

      this.isDragging = true;
      this.startY = e.touches[0].clientY;
      this.startScrollVal = this.targetScrollValue;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (
        !this.isDragging ||
        this.viewMode() !== "spiral" ||
        e.touches.length === 0
      )
        return;
      // We do not call preventDefault here to allow standard vertical page touch scrolling
      const deltaY = e.touches[0].clientY - this.startY;
      const dragSensitivity = 0.008;
      this.targetScrollValue = this.startScrollVal - deltaY * dragSensitivity;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (this.viewMode() !== "spiral") return;
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        this.targetScrollValue -= 1.0;
      } else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        this.targetScrollValue += 1.0;
      }
    };

    // Attach listeners - wheel listener must be non-passive (passive: false) to allow preventDefault()
    scrollEl.addEventListener("wheel", handleWheel, { passive: false });
    scrollEl.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    scrollEl.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleMouseUp);
    window.addEventListener("keydown", handleKeyDown);

    // Register cleanups
    this.eventCleanup.push(() =>
      scrollEl.removeEventListener("wheel", handleWheel),
    );
    this.eventCleanup.push(() =>
      scrollEl.removeEventListener("mousedown", handleMouseDown),
    );
    this.eventCleanup.push(() =>
      window.removeEventListener("mousemove", handleMouseMove),
    );
    this.eventCleanup.push(() =>
      window.removeEventListener("mouseup", handleMouseUp),
    );
    this.eventCleanup.push(() =>
      scrollEl.removeEventListener("touchstart", handleTouchStart),
    );
    this.eventCleanup.push(() =>
      window.removeEventListener("touchmove", handleTouchMove),
    );
    this.eventCleanup.push(() =>
      window.removeEventListener("touchend", handleMouseUp),
    );
    this.eventCleanup.push(() =>
      window.removeEventListener("keydown", handleKeyDown),
    );
  }

  onMouseMove(event: MouseEvent) {
    this.mouseX = event.clientX;
    this.mouseY = event.clientY;
  }

  setHoveredProject(index: number | null, videoUrl: string | null = null) {
    if (index !== null) {
      if (index === this.expandedIndex()) {
        this.hoveredIndex.set(null);
        this.hoveredVideo = null;
        return;
      }
      this.hoveredIndex.set(index);
      if (videoUrl) {
        this.hoveredVideo = this.sanitizer.bypassSecurityTrustUrl(videoUrl);
      }
    } else {
      this.hoveredIndex.set(null);
      this.hoveredVideo = null;
    }
  }

  toggleViewMode() {
    const mode = this.viewMode() === "spiral" ? "list" : "spiral";
    this.viewMode.set(mode);
    this.expandedIndex.set(null); // Collapse and reset list video playback

    // Reset target scroll if switching back to spiral
    if (mode === "spiral") {
      this.targetScrollValue = 0;
      this.scrollValue = -2.5; // Trigger a quick spin reveal
    }
  }

  // Utility to scroll directly to a project index in spiral view
  scrollToIndex(index: number) {
    this.targetScrollValue = index;
  }

  // Semantic exploration trigger (accessibility / WCAG semantic support)
  exploreProject(project: Project) {
    console.log("Exploring project details for:", project.titleKey);
    // Expandable details / redirection flow hook
  }

  // Accordion drawer handlers (List mode / Mobile version)
  toggleProjectExpand(index: number) {
    if (this.expandedIndex() === index) {
      this.expandedIndex.set(null);
    } else {
      this.expandedIndex.set(index);
      this.isMuted.set(true); // Always start muted

      // Clear hovering preview for this item immediately
      this.hoveredIndex.set(null);
      this.hoveredVideo = null;
    }
  }

  toggleMute(event: Event) {
    event.stopPropagation(); // Avoid triggering list row click closure
    this.isMuted.update((muted) => !muted);
  }
}
