// js/app.js

const SUPPORTED_LANGS = ["zh-CN", "en"];
const DEFAULT_LANG = "zh-CN";

function getInitialLang() {
    const saved = localStorage.getItem("driver-site-lang");
    if (saved && SUPPORTED_LANGS.includes(saved)) return saved;

    const browserLang = (navigator.language || "").toLowerCase();
    if (browserLang.startsWith("zh")) return "zh-CN";
    return DEFAULT_LANG;
}

let currentLang = getInitialLang();

function isWechatBrowser() {
    const ua = navigator.userAgent.toLowerCase();
    return ua.indexOf("micromessenger") !== -1;
}

function showWechatModal() {
    const modal = document.getElementById("wechatModal");
    if (!modal) return;
    modal.classList.remove("hidden");
    modal.classList.add("flex");
}

function closeWechatModal() {
    const modal = document.getElementById("wechatModal");
    if (!modal) return;
    modal.classList.remove("flex");
    modal.classList.add("hidden");
}

function formatDate(dateStr, lang) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;

    const fmtLang = lang === "zh-CN" ? "zh-CN" : "en-US";
    return d.toLocaleDateString(fmtLang, {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

function renderPage(data) {
    if (data.site) {
        document.title = data.site.title || document.title;
        const elTitle = document.getElementById("site-title");
        const elHeading = document.getElementById("page-heading");
        const elSub = document.getElementById("page-subtitle");
        if (elTitle) elTitle.textContent = data.site.navTitle || data.site.title || "Driver Download";
        if (elHeading && data.site.heading) elHeading.textContent = data.site.heading;
        if (elSub && typeof data.site.subtitle === "string") elSub.textContent = data.site.subtitle;
    }

    const container = document.getElementById("driver-list");
    if (!container) return;
    container.innerHTML = "";

    const groups = data.groups || [];
    groups.forEach(group => {
        const card = document.createElement("div");
        card.className =
            "bg-white rounded-xl overflow-hidden card-shadow hover:shadow-lg transition-all duration-300";

        const iconClass = "fa-print";

        const headerHtml = `
            <div class="bg-primary/5 p-6 border-l-4 border-primary">
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <i class="fa ${iconClass} text-primary text-2xl mr-4"></i>
                        <div>
                            <h2 class="text-xl font-bold text-neutral-700">${group.groupTitle}</h2>
                            <p class="text-neutral-500">${group.groupDesc || ""}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const items = group.items || [];
        let bodyHtml = `<div class="p-6 space-y-6">`;

        items.forEach(item => {
            const isDoc = item.type === "doc";
            const btnBaseClass =
                "px-4 py-2 rounded-lg transition-colors duration-200 flex items-center justify-center w-full sm:w-auto";
            const btnClass = isDoc
                ? `bg-neutral-600 text-white hover:bg-neutral-700 ${btnBaseClass} link-hover`
                : `bg-primary text-white hover:bg-accent ${btnBaseClass}`;

            const btnIcon = isDoc ? "fa-file-text-o" : "fa-download";
            const btnText =
                isDoc
                    ? (currentLang === "zh-CN" ? "文档" : "Document")
                    : (currentLang === "zh-CN" ? "下载" : "Download");

            const platformIcon =
                item.platform && item.platform.toLowerCase().includes("windows")
                    ? "fa-windows text-blue-600"
                    : item.platform && item.platform.toLowerCase().includes("mac")
                        ? "fa-apple text-neutral-800"
                        : item.platform && item.platform.toLowerCase().includes("linux")
                            ? "fa-linux text-orange-600"
                            : "fa-desktop text-primary";

            const updatedLabel =
                currentLang === "zh-CN"
                    ? "更新日期"
                    : "Updated on";

            let metaParts = [];
            if (item.platform) {
                metaParts.push((currentLang === "zh-CN" ? "平台" : "Platform") + "：" + item.platform);
            }
            if (item.version) {
                metaParts.push((currentLang === "zh-CN" ? "版本" : "Version") + "：" + item.version);
            }

            let descHtml = "";
            if (item.description) {
                descHtml = `<p class="text-xs text-neutral-500 mt-1">${item.description}</p>`;
            }

            bodyHtml += `
                <div class="border border-neutral-100 rounded-lg hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 p-4">
                    <div class="flex flex-col sm:flex-row justify-between gap-4">
                        <div class="flex-1">
                            <h4 class="font-medium text-neutral-700 flex items-center gap-2">
                                <i class="fa ${platformIcon} mr-1"></i>
                                <span>${item.fileName}</span>
                            </h4>
                            <div class="mt-1 text-sm text-neutral-500 space-x-3">
                                ${metaParts.join(" ")}
                            </div>
                            ${descHtml}
                        </div>
                        <div class="flex flex-col sm:flex-row items-center gap-3 sm:items-center sm:justify-end py-2 sm:py-0 whitespace-nowrap">
                            <span class="text-xs px-2 py-1 bg-neutral-100 text-neutral-600 rounded text-center">
                                ${updatedLabel} ${formatDate(item.updatedAt || "", currentLang)}
                            </span>
                            <a href="${item.url}"
                               class="download-link ${btnClass}"
                               target="_blank"
                               data-download-url="${item.url}">
                                <i class="fa ${btnIcon} mr-2"></i>
                                ${btnText}
                            </a>
                        </div>
                    </div>
                </div>
            `;
        });

        bodyHtml += `</div>`;
        card.innerHTML = headerHtml + bodyHtml;
        container.appendChild(card);
    });

    bindDownloadLinks();
}

function bindDownloadLinks() {
    const links = document.querySelectorAll(".download-link");
    links.forEach(link => {
        link.addEventListener("click", function (e) {
            if (isWechatBrowser()) {
                e.preventDefault();
                showWechatModal();
                return;
            }

            const btn = this;
            const originalHtml = btn.innerHTML;
            btn.innerHTML = `<i class="fa fa-spinner fa-spin mr-2"></i>${currentLang === "zh-CN" ? "准备下载…" : "Ready to Download..."}`;
            btn.classList.add("bg-neutral-600");
            btn.classList.remove("bg-primary", "hover:bg-accent");

            setTimeout(() => {
                btn.innerHTML = originalHtml;
                btn.classList.remove("bg-neutral-600");
                if (!btn.classList.contains("bg-neutral-600")) {
                    btn.classList.add("bg-primary", "hover:bg-accent");
                }
            }, 2000);
        });
    });
}

async function loadData(lang) {
    try {
        const res = await fetch(`./data/drivers.${lang}.json?_=${Date.now()}`);
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();
        renderPage(data);
    } catch (err) {
        console.error("Load driver data failed:", err);
        const container = document.getElementById("driver-list");
        if (container) {
            container.innerHTML = `
                <div class="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                    <p>${lang === "zh-CN" ? "加载驱动数据失败，请稍后重试。" : "Failed to load driver data. Please try again later."}</p>
                </div>
            `;
        }
    }
}

function updateLangButtons() {
    const buttons = document.querySelectorAll(".lang-btn");
    buttons.forEach(btn => {
        const lang = btn.getAttribute("data-lang");
        if (lang === currentLang) {
            btn.classList.add("border-primary", "text-primary", "bg-primary/5");
            btn.classList.remove("border-neutral-300", "text-neutral-600");
        } else {
            btn.classList.remove("border-primary", "text-primary", "bg-primary/5");
            btn.classList.add("border-neutral-300", "text-neutral-600");
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".lang-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const lang = btn.getAttribute("data-lang");
            if (!lang || lang === currentLang) return;
            if (!SUPPORTED_LANGS.includes(lang)) return;

            currentLang = lang;
            localStorage.setItem("driver-site-lang", lang);
            updateLangButtons();
            loadData(lang);
        });
    });

    const closeBtn = document.getElementById("closeModal");
    if (closeBtn) {
        closeBtn.addEventListener("click", closeWechatModal);
    }

    updateLangButtons();
    loadData(currentLang);
});
