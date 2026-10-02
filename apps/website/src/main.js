/**
 * Apex AMC — website entry module.
 *
 * Imports the dataset modules first. These are separate modules so the data
 * can be regenerated or replaced (e.g. from the D1 catalog) without touching
 * any logic.
 */
import { CALIBER_PRESETS } from './data/calibers.js';
import { RETAILERS } from './data/retailers.js';
import { CHECKLIST_ITEMS } from './data/checklist.js';
import { el, icon, externalLink } from './dom.js';
// Tailwind is compiled to a static stylesheet at build time. This import is what
// replaces the old `cdn.tailwindcss.com` runtime compiler.
import './styles/main.css';

// Mobile Drawer
        //
        // `aria-expanded` is kept in sync in one place (`setDrawerOpen`) rather
        // than at each call site. An aria attribute that disagrees with the
        // visual state is worse than a missing one: it actively tells assistive
        // technology the opposite of the truth.
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const mobileDrawer = document.getElementById('mobileDrawer');
        const menuIcon = document.getElementById('menuIcon');

        function setDrawerOpen(open) {
            mobileDrawer.classList.toggle('hidden', !open);
            menuIcon.classList.replace(open ? 'fa-bars' : 'fa-xmark', open ? 'fa-xmark' : 'fa-bars');
            mobileMenuBtn.setAttribute('aria-expanded', String(open));
        }

        mobileMenuBtn.addEventListener('click', () => {
            setDrawerOpen(mobileDrawer.classList.contains('hidden'));
        });

        document.querySelectorAll('.mobile-nav-link').forEach(link => {
            link.addEventListener('click', () => {
                setDrawerOpen(false);
            });
        });

        // DOM Input Elements for Calculator
        const factoryBoxPrice = document.getElementById('factoryBoxPrice');
        const factoryBoxCount = document.getElementById('factoryBoxCount');
        const bulletPrice = document.getElementById('bulletPrice');
        const bulletCount = document.getElementById('bulletCount');
        const primerPrice = document.getElementById('primerPrice');
        const primerCount = document.getElementById('primerCount');
        const powderPriceLb = document.getElementById('powderPriceLb');
        const powderGrains = document.getElementById('powderGrains');
        const freeBrassToggle = document.getElementById('freeBrassToggle');
        const brassPrice100 = document.getElementById('brassPrice100');
        const brassReuses = document.getElementById('brassReuses');
        const brassInputWrapper = document.getElementById('brassInputWrapper');
        const batchSize = document.getElementById('batchSize');
        const equipmentCost = document.getElementById('equipmentCost');

        // Brass Toggle state listener
        freeBrassToggle.addEventListener('change', () => {
            if (freeBrassToggle.checked) {
                brassInputWrapper.classList.add('opacity-40', 'pointer-events-none');
            } else {
                brassInputWrapper.classList.remove('opacity-40', 'pointer-events-none');
            }
            calculateCosts();
        });

        // Main Calculation Function
        function calculateCosts() {
            const facPrice = parseFloat(factoryBoxPrice.value) || 0;
            const facCount = parseFloat(factoryBoxCount.value) || 1;
            const factoryCPR = facPrice / facCount;

            const bulPrice = parseFloat(bulletPrice.value) || 0;
            const bulCnt = parseFloat(bulletCount.value) || 1;
            const bulletCPR = bulPrice / bulCnt;

            const primPrice = parseFloat(primerPrice.value) || 0;
            const primCnt = parseFloat(primerCount.value) || 1;
            const primerCPR = primPrice / primCnt;

            const powPrice = parseFloat(powderPriceLb.value) || 0;
            const powGrains = parseFloat(powderGrains.value) || 0;
            // 1 lb = 7,000 grains
            const powderCPR = (powPrice / 7000) * powGrains;

            let brassCPR = 0;
            if (!freeBrassToggle.checked) {
                const bPrice100 = parseFloat(brassPrice100.value) || 0;
                const reuses = parseFloat(brassReuses.value) || 1;
                brassCPR = (bPrice100 / 100) / reuses;
            }

            const handloadCPR = bulletCPR + primerCPR + powderCPR + brassCPR;
            const savingsPerRound = factoryCPR - handloadCPR;

            const bSize = parseFloat(batchSize.value) || 1000;
            const batchSavings = savingsPerRound * bSize;
            const kiloSavings = savingsPerRound * 1000;

            const percentSavings = factoryCPR > 0 ? ((savingsPerRound / factoryCPR) * 100) : 0;

            const equipCost = parseFloat(equipmentCost.value) || 0;
            const roundsToBreakEven = savingsPerRound > 0 ? Math.ceil(equipCost / savingsPerRound) : 0;

            // Render Output Labels
            document.getElementById('resFactoryCpr').textContent = '$' + factoryCPR.toFixed(3);
            document.getElementById('resHandloadCpr').textContent = '$' + handloadCPR.toFixed(3);
            document.getElementById('resTotalHandloadPerRound').textContent = '$' + handloadCPR.toFixed(3) + ' / round';

            document.getElementById('lblBulletCpr').textContent = '$' + bulletCPR.toFixed(3);
            document.getElementById('lblPrimerCpr').textContent = '$' + primerCPR.toFixed(3);
            document.getElementById('lblPowderCpr').textContent = '$' + powderCPR.toFixed(3);
            document.getElementById('lblBrassCpr').textContent = '$' + brassCPR.toFixed(3);

            // Cost-bar widths, via CSS custom properties rather than `element.style.width`.
            //
            // A nonce cannot apply to a style ATTRIBUTE, and these widths change on
            // every calculation, so `unsafe-hashes` was never a workable substitute in
            // the CSP. Custom properties are set through the CSSOM, which CSP does not
            // govern - so the page keeps a genuinely strict policy with no escape
            // hatch.
            const total = handloadCPR > 0 ? handloadCPR : 1;
            document.getElementById('barBullet').style.setProperty('--bar-width', ((bulletCPR / total) * 100) + '%');
            document.getElementById('barPrimer').style.setProperty('--bar-width', ((primerCPR / total) * 100) + '%');
            document.getElementById('barPowder').style.setProperty('--bar-width', ((powderCPR / total) * 100) + '%');
            document.getElementById('barBrass').style.setProperty('--bar-width', ((brassCPR / total) * 100) + '%');

            // Savings Badges
            const badge = document.getElementById('savingsBadge');
            if (savingsPerRound > 0) {
                badge.textContent = '-' + Math.round(percentSavings) + '% Savings';
                badge.className = 'px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold text-xs border border-emerald-500/30';
            } else {
                badge.textContent = 'No Savings';
                badge.className = 'px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 font-extrabold text-xs border border-amber-500/30';
            }

            document.getElementById('resSavingsPerRound').textContent = (savingsPerRound >= 0 ? '+' : '') + '$' + savingsPerRound.toFixed(3);
            document.getElementById('resBatchSavings').textContent = (batchSavings >= 0 ? '+' : '') + '$' + batchSavings.toFixed(2);
            document.getElementById('resBatchLabel').textContent = bSize.toLocaleString();
            document.getElementById('resKiloSavings').textContent = (kiloSavings >= 0 ? '+' : '') + '$' + kiloSavings.toFixed(2);

            document.getElementById('resEquipCostDisp').textContent = '$' + equipCost.toFixed(2);
            if (savingsPerRound > 0) {
                document.getElementById('resBreakEvenRounds').textContent = roundsToBreakEven.toLocaleString() + ' rounds';
                document.getElementById('resBreakEvenRoundsText').textContent = roundsToBreakEven.toLocaleString() + ' rounds';
            } else {
                document.getElementById('resBreakEvenRounds').textContent = 'N/A';
                document.getElementById('resBreakEvenRoundsText').textContent = 'N/A (Handloads exceed factory cost)';
            }
        }

        // Attach event listeners to inputs
        const allCalcInputs = [
            factoryBoxPrice, factoryBoxCount, bulletPrice, bulletCount, primerPrice, primerCount,
            powderPriceLb, powderGrains, brassPrice100, brassReuses, batchSize, equipmentCost
        ];
        allCalcInputs.forEach(input => {
            input.addEventListener('input', calculateCosts);
            input.addEventListener('change', calculateCosts);
        });

        // Preset Buttons Click Handler
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const presetKey = btn.getAttribute('data-preset');

                // Style active state
                document.querySelectorAll('.preset-btn').forEach(b => {
                    b.className = 'preset-btn px-3 py-2 rounded-lg bg-tactical-800 border border-slate-700 text-slate-300 font-semibold text-xs text-center hover:bg-tactical-700 transition-all flex items-center justify-center gap-1.5';
                });
                btn.className = 'preset-btn px-3 py-2 rounded-lg bg-tactical-800 border border-emerald-500 text-emerald-400 font-semibold text-xs text-center hover:bg-tactical-700 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10';

                if (presetKey in CALIBER_PRESETS) {
                    const data = CALIBER_PRESETS[presetKey];
                    factoryBoxPrice.value = data.factoryBoxPrice;
                    factoryBoxCount.value = data.factoryBoxCount;
                    bulletPrice.value = data.bulletPrice;
                    bulletCount.value = data.bulletCount;
                    primerPrice.value = data.primerPrice;
                    primerCount.value = data.primerCount;
                    powderPriceLb.value = data.powderPriceLb;
                    powderGrains.value = data.powderGrains;
                    freeBrassToggle.checked = data.freeBrass;
                    brassPrice100.value = data.brassPrice100;
                    brassReuses.value = data.brassReuses;

                    if (data.freeBrass) {
                        brassInputWrapper.classList.add('opacity-40', 'pointer-events-none');
                    } else {
                        brassInputWrapper.classList.remove('opacity-40', 'pointer-events-none');
                    }

                    calculateCosts();
                    showToast('Loaded ' + btn.textContent.trim() + ' Preset');
                }
            });
        });

        // Render Retailer Cards
        const retailerGrid = document.getElementById('retailerGrid');
        const directorySearch = document.getElementById('directorySearch');
        let currentCategory = 'all';

        function renderRetailers() {
            const query = directorySearch.value.toLowerCase().trim();
            // Clearing via replaceChildren, not innerHTML, so the sink stays
            // out of the file entirely.
            retailerGrid.replaceChildren();

            const filtered = RETAILERS.filter(r => {
                const matchesCat = (currentCategory === 'all') || r.cat.includes(currentCategory);
                const matchesSearch = r.name.toLowerCase().includes(query) ||
                                      r.specialty.toLowerCase().includes(query) ||
                                      r.description.toLowerCase().includes(query);
                return matchesCat && matchesSearch;
            });

            if (filtered.length === 0) {
                const empty = el('div', 'col-span-full text-center py-12 text-slate-400 space-y-2');
                empty.appendChild(icon('fa-store-slash text-3xl text-slate-600'));
                empty.appendChild(el('p', 'text-sm', 'No suppliers found matching your query.'));
                retailerGrid.appendChild(empty);
                return;
            }

            filtered.forEach(r => {
                retailerGrid.appendChild(retailerCard(r));
            });
        }

        /** Build one retailer card using DOM nodes, never innerHTML. */
        function retailerCard(r) {
            const card = el('div', 'p-6 rounded-2xl bg-tactical-950 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between group');

            const top = el('div', 'space-y-3');

            // `specialty` is a factual label for what the retailer sells. It is
            // deliberately not a badge: the badges here were superlatives
            // ("Top Choice", "Powder Authority") with nothing behind them.
            const names = el('div');
            names.appendChild(el('span', 'px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold text-[10px] uppercase border border-emerald-500/20', r.specialty));
            names.appendChild(el('h3', 'text-lg font-bold text-slate-100 mt-2 group-hover:text-emerald-400 transition-colors', r.name));

            top.appendChild(names);
            top.appendChild(el('p', 'text-xs text-slate-400 leading-relaxed', r.description));
            card.appendChild(top);

            const bottom = el('div', 'pt-6 space-y-3');

            // No star rating, and no "Verified Shipping Partner". Both asserted a
            // review history and a verification that never happened - see the
            // header of data/retailers.js for the full reasoning.
            bottom.appendChild(externalLink(
                r.link,
                'w-full py-2.5 rounded-xl bg-tactical-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 border border-slate-700 hover:border-emerald-500',
                'Visit ' + r.name,
                'fa-arrow-up-right-from-square text-[10px]',
            ));

            card.appendChild(bottom);
            return card;
        }

        // Category Filter Buttons
        document.querySelectorAll('.cat-pill').forEach(btn => {
            btn.addEventListener('click', () => {
                currentCategory = btn.getAttribute('data-cat');
                document.querySelectorAll('.cat-pill').forEach(b => {
                    b.className = 'cat-pill px-3.5 py-1.5 rounded-full bg-tactical-800 text-slate-300 hover:bg-tactical-700 font-medium text-xs transition-all border border-slate-700';
                });
                btn.className = 'cat-pill px-3.5 py-1.5 rounded-full bg-emerald-500 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20';
                renderRetailers();
            });
        });

        directorySearch.addEventListener('input', renderRetailers);

        // Render Checklist
        const checklistContainer = document.getElementById('checklistContainer');
        function renderChecklist() {
            checklistContainer.replaceChildren();
            CHECKLIST_ITEMS.forEach(item => {
                const label = el('label', 'flex items-start gap-3 p-3.5 rounded-xl bg-tactical-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all');

                const box = document.createElement('input');
                box.type = 'checkbox';
                box.className = 'mt-1 w-4 h-4 rounded bg-tactical-900 border-slate-700 text-emerald-500 focus:ring-emerald-500';

                const text = el('div');
                text.appendChild(el('div', 'text-xs font-bold text-slate-200', item.title));
                text.appendChild(el('div', 'text-[11px] text-slate-400 mt-0.5', item.desc));

                label.appendChild(box);
                label.appendChild(text);
                checklistContainer.appendChild(label);
            });
        }

        // Copy Checklist Button
        document.getElementById('copyChecklistBtn').addEventListener('click', () => {
            const text = CHECKLIST_ITEMS.map(i => `[ ] ${i.title}: ${i.desc}`).join('\n');
            navigator.clipboard.writeText(text).then(() => {
                showToast('Checklist copied to clipboard!');
            }).catch(() => {
                showToast('Copied checklist!');
            });
        });

        // Toast Helper
        function showToast(msg) {
            const toast = document.getElementById('toast');
            document.getElementById('toastMsg').textContent = msg;
            toast.classList.remove('translate-y-20', 'opacity-0');
            setTimeout(() => {
                toast.classList.add('translate-y-20', 'opacity-0');
            }, 3000);
        }

        // Initial Load Invocation
        calculateCosts();
        renderRetailers();
        renderChecklist();
