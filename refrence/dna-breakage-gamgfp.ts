import type { Paper } from '@/lib/types';

/* ══════════════════════════════════════════════════════════════════════════
   LOCKED CONTENT — do not edit without explicit instruction.

   `t` fields are the authors' published text, reproduced VERBATIM under
   CC-BY. Rewording them breaks the licence terms and the product's premise.

   `n`, `f`, `tk`, `x` and `plain` are FirstPaper's teaching copy. They are
   pedagogically tuned — each note is pitched at a specific reading level and
   each judge takeaway names a transferable skill. Do not rewrite for tone,
   brevity or style.

   Run `node scripts/verify-content.js` after any change to this file.
   ══════════════════════════════════════════════════════════════════════════ */

export const dnaBreakageGamGFP: Paper = {
  slug: 'dna-breakage-gamgfp',
  meta: {
    title: "Engineered proteins detect spontaneous DNA breakage in human and bacterial cells",
    authors: "Shee C, Cox BD, Gu F, Luengas EM, Joshi MC, Chiu L-Y, Magnan D, Halliday JA, Frisch RL, Gibson JL, Nehring RB, Do HG, Hernandez M, Li L, Herman C, Hastings PJ, Bates D, Harris RS, Miller KM, Rosenberg SM",
    cite: "eLife 2013;2:e01222",
    url: "https://doi.org/10.7554/eLife.01222",
    licence: "Copyright Shee et al. Distributed under the Creative Commons Attribution License (CC-BY), which permits unrestricted use and redistribution provided the original author and source are credited. Paper text and figures are reproduced verbatim under that licence. Materials and methods and the reference list are not reproduced here — read them in the original.",
  },

  sections: [
    /* ── 1 · Abstract ── */
    {
      n: "Abstract",
      paras: [
        {
          t: "Spontaneous DNA breaks instigate genomic changes that fuel cancer and evolution, yet direct quantification of double-strand breaks (DSBs) has been limited. Predominant sources of spontaneous DSBs remain elusive.",
          n: {
            e: "DNA snapping in half is a big deal — it helps cause cancer and drives evolution. But nobody could count how often it happens, or say what causes most of it.",
            r: "Two gaps are being named: we can't directly count double-strand breaks, and we don't know what produces most of the spontaneous ones. Everything that follows exists to close those two gaps.",
            c: "The opening establishes both a methodological gap (direct DSB quantification is limited) and a mechanistic one (predominant sources remain elusive). Note these are separable problems — the paper addresses the first to attack the second.",
          },
        },
        {
          t: "We report synthetic technology for quantifying DSBs using fluorescent-protein fusions of double-strand DNA end-binding protein, Gam of bacteriophage Mu. In <i>Escherichia coli</i> GamGFP forms foci at chromosomal DSBs and pinpoints their subgenomic locations.",
          n: {
            e: "Their fix: glue a virus protein that grabs broken DNA ends onto a protein that glows green. Breaks turn into bright dots you can see and locate.",
            r: "The reagent is a fusion protein: Gam (binds double-stranded DNA ends) joined to GFP (fluoresces). \"Foci\" means concentrated bright spots — where Gam clusters on a break, the glow concentrates.",
            c: "A fusion of the phage Mu Gam protein — a DSE-binding protein orthologous to Ku — with GFP. The claim is not merely detection but subgenomic localisation, which is a stronger claim requiring separate validation later.",
          },
        },
        {
          t: "Spontaneous DSBs occur mostly one per cell, and correspond with generations, <mark class=\"t\">supporting replicative models</mark> for spontaneous breakage, and providing the first true breakage rates.",
          n: {
            e: "Breaks come one at a time, and they show up in step with cells dividing — hinting that copying DNA is what causes them.",
            r: "Two findings: breaks are single events, not catastrophes, and they track generations rather than clock time. Hold onto the word \"supporting\" — it's doing careful work.",
            c: "Generation-dependence discriminates replicative from time-dependent models. Note the deliberate verb asymmetry in one sentence: \"supporting\" for the mechanistic inference, but \"providing the first true breakage rates\" for the measurement.",
          },
        },
        {
          t: "In mammalian cells GamGFP—labels laser-induced DSBs antagonized by end-binding protein Ku; co-localizes incompletely with DSB marker 53BP1 suggesting superior DSB-specificity; blocks resection; and demonstrates DNA breakage via APOBEC3A cytosine deaminase. We demonstrate directly that some spontaneous DSBs occur outside of S phase.",
          n: {
            e: "It works in human cells too. A rival protein called Ku fights it for the same broken ends. And it showed that a human enzyme causes breaks.",
            r: "Four mammalian claims packed into one sentence: it labels breaks, Ku competes with it, it only partly agrees with the standard marker 53BP1, and it implicates the enzyme APOBEC3A. Each gets its own experiment later.",
            c: "Dense claim stacking. \"Suggesting superior DSB-specificity\" is an inference from incomplete co-localisation — reversible in principle, since the same data could indicate lower sensitivity. The paper addresses this ambiguity directly in the Discussion.",
          },
        },
      ],
      figs: [
      ],
    },
    /* ── 2 · eLife digest ── */
    {
      n: "eLife digest",
      paras: [
        {
          t: "Cells have developed a variety of mechanisms for repairing DNA molecules when breaks occur in one or both of the DNA strands. However, we know relatively little about the causes of these breaks, which often occur naturally, or even about how common they are.",
          n: {
            e: "Cells can fix broken DNA. But we don't really know what breaks it, or how often.",
            r: "This is the journal's own plain-language summary — written for non-specialists, so it's the easiest way into the paper. Same content, gentler language.",
            c: "eLife digests are editorially written for a general audience and are worth reading first even as an expert, because they reveal what the journal considered the load-bearing claims.",
          },
        },
        {
          t: "Learning more about the most common forms of DNA breakage is important because the genomic changes caused by these breaks are driving forces behind both cancer and evolution, including the evolution of drug resistance in bacteria.",
          n: {
            e: "Why care? Broken DNA causes the changes behind cancer, evolution, and antibiotic resistance.",
            r: "The stakes clause. Notice it names three separate domains — oncology, evolutionary biology, and antimicrobial resistance — which is how a basic-science finding justifies broad interest.",
            c: "The tripartite justification (cancer, evolution, AMR) is standard framing for DSB work and is well supported in the literature. It is motivation rather than a claim of this paper.",
          },
        },
        {
          t: "Shee et al. have developed a new method for detecting double-strand breaks in both bacterial and mammalian cells. The method involved combining a natural virus protein called Gam with a fluorescent protein called GFP (short for green fluorescent protein) to make a fusion protein called GamGFP. Gam was chosen because it binds only to double-strand breaks, traps double-strand breaks, and does not bind to any proteins.",
          n: {
            e: "Gam was picked for three reasons: it only sticks to double-strand breaks, it holds onto them, and it ignores other proteins.",
            r: "This states the design rationale explicitly — three properties that justify choosing Gam. Worth remembering, because \"traps double-strand breaks\" turns out to be a limitation as well as a feature.",
            c: "The selection criteria are DSE-specificity, end-trapping, and absence of protein–protein interaction. The second property is double-edged: trapping prevents repair, which perturbs the system under observation.",
          },
        },
        {
          t: "Shee et al. used this approach to detect double-strand breaks in both <i>Escherichia coli</i> cells and mammalian cells, and to measure the rate of spontaneous DNA breakage in <i>E. coli</i>. The number of double-strand breaks in <i>E. coli</i> was proportional to the number of times the cells had divided, which provides support for DNA replication-dependent models of spontaneous DNA breakage.",
          n: {
            e: "Breaks went up with the number of times cells divided. That points at DNA copying as the cause.",
            r: "\"Proportional to the number of times the cells had divided\" is the core finding restated plainly. Proportionality to divisions, not to time, is what makes it evidence for replication.",
            c: "Proportionality to division number rather than elapsed time is the discriminating observation. The digest again uses \"provides support for\" rather than a causal verb.",
          },
        },
        {
          t: "In future, this approach might allow the trapping, mapping and quantification of DNA breaks in all kinds of cells, and the <mark class=\"t\">highly specific way GamGFP binds to breaks could make it the preferred tool</mark> for studying DNA breakage in mammalian cells.",
          n: {
            e: "They think this could become the go-to tool. That's a hope about the future, not something they measured.",
            r: "A forward-looking claim, not a result. No comparison of tools across labs was run. File this in a different mental pile from the findings.",
            c: "Standard closing prospection. \"Could make it the preferred tool\" is an adoption forecast with no supporting comparative data; treat separately from the empirical claims.",
          },
        },
      ],
      figs: [
      ],
    },
    /* ── 3 · Introduction ── */
    {
      n: "Introduction",
      paras: [
        {
          t: "DNA double-strand breaks (DSBs) are the most genome-destabilizing DNA damage. 'DSBs' is used here as a collective term that includes two-ended structures (DSBs, e.g., as caused by double-strand endonucleases or ionizing radiation) and single double-stranded ends of DNA (DSEs, or one-ended DSBs), such as are caused by replication-fork collapses.",
          n: {
            e: "There are two kinds of break: one where DNA snaps clean in two (two ends), and one where a copying machine falls off and leaves a single loose end.",
            r: "A definitions paragraph, and it matters later. Two-ended DSBs come from something cutting across the DNA; one-ended DSEs come from a replication fork collapsing. The paper detects both, but proves it separately.",
            c: "Terminological groundwork that is load-bearing for the Figure 2D–E result. The DSB/DSE distinction determines what the F-plasmid nicking experiment is actually demonstrating.",
          },
        },
        {
          t: "DSBs (one- and two-ended) promote deletions, genome rearrangements, chromosome loss, and point mutations. DSB-induced genomic instability promotes cancer and genetic diseases, evolution of antibiotic resistance and of pathogenic bacteria including in biofilms. Despite the importance of DSBs to many biological processes, quantification of DSBs has been limited.",
          n: {
            e: "Breaks cause a whole list of damage — lost chunks of DNA, scrambled chromosomes, mutations. And they matter for cancer and antibiotic resistance.",
            r: "Consequences first, then the gap. The rhetorical move is: this is important, and yet we can't measure it. Every methods paper builds this exact ramp.",
            c: "Standard importance-then-gap construction. The consequences listed are well established; the novel assertion is the persistence of the quantification limitation.",
          },
        },
        {
          t: "DSBs have been quantified via neutral sucrose gradients, or pulse-field gels (PFGE), neither of which routinely detects DSBs present in fewer than ∼10% of a population of molecules, far above DSB levels that occur in cells spontaneously. The standard single-cell gel electrophoresis ('comet') assay detects single-strand (ss) DNA nicks and DSBs, and thus is not specific to DSBs, whereas the neutral comet assay is DSB-specific, but lacks sensitivity.",
          n: {
            e: "Older methods have two problems: some can't detect breaks unless there are loads of them, and others detect the wrong things too.",
            r: "They're eliminating rivals on two separate axes — sensitivity (can it see rare breaks?) and specificity (does it only see breaks?). Existing methods fail one or the other.",
            c: "A systematic two-axis elimination. Note the sensitivity floor (~10% of molecules) is quantified against physiological break frequency, which is a fair comparison rather than a rhetorical one.",
          },
        },
        {
          t: "Cytological assays for foci of DSB-repair proteins identify locations of DSBs in situ via surrogate markers γ-H2AX, Mre11, Rad50, Rad51, Rad52, BRAC1, Ku80/70, and 53BP1 in eukaryotes. γ-H2AX and 53BP1, the most commonly used DSB markers in mammalian cells, are indirect markers. <mark class=\"t\">Antibodies to γ-H2AX and 53BP1 detect a modified histone and a DNA repair protein respectively, rather than DNA ends</mark>, and are likely to label sites not currently possessing a DSB.",
          n: {
            e: "The popular methods don't spot the break itself — they spot other molecules that gather nearby. So you can get a signal where there's no actual break.",
            r: "This is the central criticism. γ-H2AX and 53BP1 are proxies: they detect the cell's <i>response</i> to damage, not the damage. A proxy can persist after repair, or appear without a break.",
            c: "The specificity critique that motivates the entire paper. Surrogate markers report damage-response products rather than frank double-strand ends, so signal can outlast repair or arise at non-DSB lesions.",
          },
        },
        {
          t: "γ-H2AX spreads over up to ∼2-Mbp regions that comprise 500 to 8000 γ-H2AX molecules, so does not pinpoint DSB sites. Numbers of γ-H2AX foci induced by DNA damage may not represent true numbers of DSBs, and γ-H2AX focus formation is variable and can occur at non-DSB sites. Thus, γ-H2AX may not always signify a physical break.",
          n: {
            e: "One popular marker smears across a huge stretch of DNA, so it can't tell you exactly where the break is.",
            r: "A resolution problem on top of the specificity problem: the signal spreads across up to two million DNA letters, so it gives you a neighbourhood, not an address.",
            c: "Spatial resolution failure. Spreading over ~2 Mbp with 500–8000 molecules per focus precludes site-level localisation, which is precisely the capability claimed for GamGFP in Figure 3.",
          },
        },
        {
          t: "DSBs can arise by several different mechanisms, many involving DNA replication. Replication-fork collapse at ssDNA nicks creates one-ended DSBs. Though replication can generate DSBs, whether it is the principle generator of DSBs spontaneously, in cells/sites not specifically engineered to maximize collisions, has not been addressed.",
          n: {
            e: "People suspected DNA copying causes breaks, but earlier studies used cells deliberately rigged to make it happen. Nobody checked normal cells.",
            r: "The precise open question. Prior work showed replication <i>can</i> cause breaks in engineered systems; nobody had shown it's what actually causes most breaks in ordinary cells.",
            c: "The critical framing. Earlier demonstrations relied on engineered constructs or mutant proteins that maximise fork collisions, so they establish sufficiency rather than typicality. This paper targets the latter.",
          },
        },
        {
          t: "In this study, we develop engineered proteins for specific detection of DSBs in bacterial and mammalian cells, and use them to illuminate spontaneous DNA breakage in both. Gam is the ortholog of eukaryotic and bacterial Ku, but, unlike Ku proteins, does not perform DNA repair reactions nor bind any other known protein.",
          n: {
            e: "Their solution: use Gam, which is like the protein Ku but simpler — it doesn't repair anything or stick to other proteins.",
            r: "The justification for Gam specifically. It's related to Ku (a natural end-binder) but stripped of the complications: no repair activity, no protein partners. Cleaner signal.",
            c: "Gam's orthology to Ku supplies the end-binding function while its lack of repair activity and protein–protein interactions removes confounds that make Ku itself a poor reporter.",
          },
        },
      ],
      figs: [
      ],
    },
    /* ── 4 · Results — building the tool ── */
    {
      n: "Results — building the tool",
      paras: [
        {
          h: "Production of functional GamGFP from the E. coli chromosome",
          t: "We constructed a regulatable chromosomal expression cassette of Mu <i>gam</i> and a Mu <i>gam-gfp</i> fusion gene in the <i>E. coli</i> chromosome, controlled by the doxycyline/tetracycline-inducible P<sub>N25tetO</sub> promoter. Promoter-only and GFP-only controls were also constructed. Production of GFP, Gam, and GamGFP were verified by SDS-PAGE and western analyses.",
          n: {
            e: "They built an on/off switch for the glowing protein, plus two \"control\" versions to compare against.",
            r: "Note \"GFP-only controls\" — a version with the glow but no break-grabber. That control does enormous work later. Also note they verified the proteins were actually made before assuming anything.",
            c: "An inducible chromosomal cassette rather than a plasmid, giving single-copy expression. The promoter-only and GFP-only strains are the negative controls; protein production was confirmed biochemically before phenotypic assays.",
          },
        },
        {
          t: "We show that chromosomally encoded Gam and GamGFP are functional in <i>E. coli</i> by demonstrating that their production blocks the action of RecBCD, a highly DSE-specific dsDNA exonuclease, in two assays.",
          n: {
            e: "Before trusting the glow, prove the grabber grabs. Trick: bacteria have a machine (RecBCD) that chews loose DNA ends. If Gam sits on those ends, chewing should stop.",
            r: "This is indirect but clever. They can't watch Gam bind directly, so they test it functionally: does its presence block an enzyme that needs the same DNA ends?",
            c: "Functional validation by competitive occlusion. The logic depends on RecBCD's established DSE-specificity — blockade of RecBCD activity is therefore diagnostic of end occupancy.",
          },
        },
        {
          t: "First, phage lambda (λ) lacking its own Gam protein and Red recombination proteins forms small plaques because RecBCD DSE-dependent exonuclease prevents λ rolling-circle replication. We show that wild-type <i>E. coli</i> producing either Mu Gam or GamGFP allow large plaque formation by λ<i>red<sup>−</sup> gam<sup>−</sup></i>, equivalent to those seen on <i>recB</i>-null-mutant <i>E. coli</i>.",
          n: {
            e: "Test one uses viruses. The virus can only spread if DNA ends survive. Bigger holes in the bacterial lawn = ends survived = Gam is working.",
            r: "A plaque is a clear patch where virus has killed bacteria. Bigger plaque means the virus replicated better, which requires surviving DNA ends. So plaque size is a readout for whether Gam protected the ends.",
            c: "A gain-of-function readout. λ<i>red<sup>−</sup>gam<sup>−</sup></i> plaque size reports rolling-circle replication competence, which depends on end survival. Equivalence to <i>recB</i>-null indicates functional RecBCD blockade.",
          },
        },
        {
          t: "Second, <i>recB</i>-null cells are highly sensitive to ultraviolet (UV) light because they are DSB-repair deficient, and UV-induced damage can lead to DSBs, which are lethal if not repaired. We find that induction of Gam or GamGFP in wild-type <i>E. coli</i> creates a phenocopy of the <i>recB</i> UV sensitivity that is almost identical to that of <i>recB<sup>−</sup></i> cells.",
          n: {
            e: "Test two uses UV light. Cells that can't fix breaks die fast under UV. Switch Gam on and normal cells start dying just like the broken mutants.",
            r: "\"Phenocopy\" means making a normal cell behave like a mutant. If switching on Gam makes healthy cells as UV-fragile as repair-deficient ones, Gam must be blocking repair — which means it's on the ends.",
            c: "A loss-of-function readout, mechanistically independent of the plaque assay. Phenocopy of the <i>recB</i> UV-sensitivity phenotype indicates functional blockade of RecBCD-dependent DSB repair.",
          },
        },
        {
          t: "Additionally, we also show that long-term Gam or GamGFP production confers poor viability, expected for DSB-repair-deficient cells. We show that long-term Gam production causes a similar low viability of 32 ± 9% viable cells relative to uninduced or wild type (WT) cells. <mark class=\"t\">GamGFP shows even further reduced viability (0.5% ± 0.06%)</mark>, even though GFP production alone causes no reduction in viability.",
          n: {
            e: "Leaving the tool switched on for a long time kills most of the cells — because they can't repair breaks anymore.",
            r: "A cost worth noticing: 0.5% viability is severe. It confirms the tool blocks repair, but it also means you can't leave it on indefinitely. GFP alone causes no harm, so it's Gam doing this.",
            c: "Viability data corroborate repair blockade and imply GamGFP blocks both RecBC-dependent and residual RecBC-independent pathways. The 0.5% figure also bounds the experimental window for long-term imaging.",
          },
        },
      ],
      figs: [
        {
          n: 1,
          src: "/figures/fig1.jpg",
          cap: "<b>Figure 1.</b> GamGFP production mimics <i>recB</i> double-strand-exonuclease defect. (A) Doxycycline-inducible <i>gam-gfp</i> fusion construct in the <i>E. coli</i> chromosome. (B) Phage λ assay for end-blocking activity by Mu Gam and GamGFP. (C) λ<i>red gam</i> plaques are small on <i>recB<sup>+</sup></i> (WT) and large on <i>recB</i>-deficient cells. (D) λ<i>red gam</i> produce large plaques on WT cells if Gam or GamGFP are produced. (E) UV sensitivity of <i>E. coli recB</i>-null mutant compared with WT and uninduced cells. (F) Induction of Gam or GamGFP causes UV sensitivity similar to that of <i>recB</i>-null mutant cells.",
          x: "<b>How to read it</b> Six panels proving the protein works before anyone trusts a single dot. <b>C</b> and <b>D</b> are petri dishes — each speck is a hole eaten by virus. Small specks mean DNA ends got chewed up; big ones mean something blocked the chewing. <b>E</b> and <b>F</b> are survival curves on a <i>log scale</i>, so every step down the axis is 10× fewer survivors, not one fewer. In E the red mutant line plummets alone. In F, with Gam switched on, the other lines have dropped down to join it. Same cells, one switch flipped — that pairing is the whole argument.",
        },
      ],
    },
    /* ── 5 · Results — do the dots mean breaks? ── */
    {
      n: "Results — do the dots mean breaks?",
      paras: [
        {
          h: "GamGFP forms foci at two-ended DSBs",
          t: "We used the chromosomal regulatable I-<i>Sce</i>I double-strand endonuclease and chromosomal I-<i>Sce</i>I cutsites (I-sites) to make site-specific DSBs in the <i>E. coli</i> chromosome and show that GamGFP forms foci at DSBs in living cells. First, when GamGFP is produced for 3 hr in cells without I-<i>Sce</i>I endonuclease, spontaneous foci are visible in ∼7.5% of cells.",
          n: {
            e: "They used molecular scissors to cut DNA at a chosen spot, then looked for dots.",
            r: "I-SceI is an enzyme that cuts DNA at one very specific sequence, so they control exactly where a break happens. If dots appear there, dots mean breaks.",
            c: "Site-specific cleavage provides ground truth: the break location is known in advance, so focus formation can be scored against a known positive.",
          },
        },
        {
          t: "Second, GamGFP forms foci in almost all cells when I-<i>Sce</i>I is induced in cells carrying an I-<i>Sce</i>I cutsite, and not in cells expressing only the enzyme (no cutsite), or carrying the cutsite but no enzyme. These data imply that DSBs underlie foci.",
          n: {
            e: "Scissors plus target = dots. Scissors alone, or target alone = no dots. So dots need an actual cut.",
            r: "This is a two-way control. You need both the enzyme and its target for dots to appear — which rules out the enzyme itself causing dots, and the target sequence causing dots.",
            c: "A factorial control design. Neither enzyme alone nor cutsite alone produces foci, isolating the cleavage event as the necessary condition.",
          },
        },
        {
          t: "Third, we varied the number of DSBs per cell by using rapidly growing cells with the I-site either near the replication origin (<i>ori</i>) or near the replication terminus. Whereas the cells with an <i>ori</i>-proximal I-site had 57 ± 2% of cells with &gt;1 focus, those with the <i>ter</i>-proximal I-site had a significantly lower 14 ± 3% of cells with &gt;1 focus (p=0.0001). The data show that foci form proportionately to the number of DSBs per cell.",
          n: {
            e: "Fast-growing bacteria have more copies of the DNA near the start point. More copies means more cuts — and they saw more dots. The dots scale with the breaks.",
            r: "A neat dose test. Because replication starts at one point, a growing cell has more copies of the origin region than the terminus. Cutting near the origin makes more breaks per cell, and more dots appeared. Number of dots tracks number of breaks.",
            c: "An internal dose-response using copy-number asymmetry in replicating cells. The 57% vs 14% difference (p=0.0001) with independently qPCR-confirmed copy ratios establishes proportionality between foci and DSB number.",
          },
        },
        {
          h: "GamGFP detects one-ended DSBs",
          t: "By contrast a one-ended DSB is expected to result when replication encounters a ssDNA nick via fork collapse. We mimicked such fork collapses using the constitutive ssDNA nicking that occurs in the <i>E. coli</i> F conjugative plasmid. We observe a TraI-dependent, four-fold increase in GamGFP foci in F′-carrying cells compared with isogenic F<sup>−</sup> cells, implying that GamGFP also labels one-ended DSBs.",
          n: {
            e: "They also tested the other kind of break — the single loose end. Four times more dots appeared, and only when the nicking enzyme was present.",
            r: "Remember the two break types from the introduction? This proves the tool sees both. The word \"isogenic\" matters: the comparison strains are genetically identical apart from the one thing being tested.",
            c: "Demonstrates detection of one-ended DSEs arising from fork collapse at a defined nick. The isogenic <i>traI</i> deletion controls for plasmid carriage per se, isolating the nicking activity.",
          },
        },
        {
          h: "DSB-detection efficiency",
          t: "We find that focus formation is linearly related to gamma-ray dose over the range of 0–140 Gy (r<sup>2</sup> = 0.991). We observed 3.07 foci per cell given 140 Gy, or 0.022 foci/cell/Gy. Comparing this with the figure obtained by sucrose sedimentation of 0.031 DSBs/cell/Gy for <i>E. coli</i>, we infer an efficiency of detection of DSBs as GamGFP foci of 71%.",
          n: {
            e: "More radiation, more dots — in a straight line. Comparing to an older measurement, the tool finds about 71% of breaks.",
            r: "A dose-response is powerful evidence: if your signal rises in step with damage you deliberately deliver, it's almost certainly measuring that damage. r² = 0.991 means an almost perfect straight line.",
            c: "Linear dose-response (r²=0.991) anchors an absolute efficiency estimate against Bonura and Smith's 1977 sucrose-sedimentation value. The estimate inherits any error in that historical measurement.",
          },
        },
        {
          t: "<mark class=\"t\">The 71% efficiency of detection should be considered a rough estimate</mark> because although we used identical growth medium and conditions to those used previously, we did not perform independent measurement of DSBs after IR by neutral sucrose gradients as per Bonura and Smith (1977). However, using an independent method below, we obtained a roughly similar estimate of efficiency.",
          n: {
            e: "They're honest that the 71% number is rough, because it depends on someone else's old measurement they didn't repeat.",
            r: "This is the paper flagging its own weak spot without being asked. The number leans on a 1977 experiment they didn't rerun — so they say so, and then go get a second estimate a different way.",
            c: "Explicit qualification of a derived parameter, with the dependency named. The subsequent independent estimate (82%, Figure 3) provides partial triangulation rather than confirmation.",
          },
        },
      ],
      figs: [
        {
          n: 2,
          src: "/figures/fig2.jpg",
          cap: "<b>Figure 2.</b> GamGFP foci at DSBs in living <i>E. coli</i>. (A) Strategy: cells have more copies of <i>oriC</i>-proximal than <i>ter</i>-proximal DNA and so will have more DSBs per cell when cleaved near <i>ori</i>. (B) Representative data (arrows indicate foci). (C) Cells have &gt;1 focus when cleaved near <i>ori</i>, usually 1 focus per cell when cleaved near <i>ter</i>, far fewer with foci when only spontaneous DSBs are present, and &lt;0.03% of cells with foci when GFP alone is produced. (D) Strategy: a nick made by TraI at <i>oriT</i> becomes a one-ended DSB upon replication by fork collapse. (E) TraI-dependent GamGFP foci imply that GamGFP detects one-ended DSBs. (F) GamGFP foci are correlated with dose of DSB-producing γ-radiation.",
          x: "<b>How to read it</b> This figure decides whether the whole paper stands. <b>B</b> is the raw evidence — four microscope fields. Top-left is GFP alone: cells glow evenly, no dots. Top-right is Gam-GFP with no deliberate cutting: one lonely arrow. The bottom two have breaks induced, and the fields are covered in arrows. You can judge this panel with your own eyes before reading a single number. <b>C</b> quantifies it as stacked bars — green is cells with one focus, red is more than one. Look at the leftmost bar, labelled GFP, annotated \"&lt; 0.03\": it is essentially flat, and that flat bar is the control that kills the most dangerous alternative explanation. <b>E</b> is the one-ended test: the middle bar (F′, with the nicking enzyme) is four times the flanking ones. <b>F</b> is the dose-response — foci climb steadily with radiation.",
        },
      ],
    },
    /* ── 6 · Results — locating breaks ── */
    {
      n: "Results — locating breaks",
      paras: [
        {
          h: "GamGFP pinpoints subgenomic locations of DSBs",
          t: "We show that GamGFP foci indicate the subcellular/subgenomic locations of DSBs in <i>E. coli</i> using site-specific I-<i>Sce</i>I cleavage combined with a fixed chromosomal tetracycline operator (<i>tetO</i>) array bound by a Tet repressor (TetR)-mCherry fusion protein, which forms a focus at a site near <i>oriC</i>. In cells carrying this chromosomal-site label, we introduced an I-site either 10 kb, 55 kb, 80 kb or 2.4 Mb away in different strains.",
          n: {
            e: "They put a red marker at a fixed spot on the DNA, then made breaks at four different distances from it — like a ruler test.",
            r: "Two colours: a red marker at a known chromosome position, and the green break detector. If green really marks the break, then moving the break further from the red marker should separate the colours.",
            c: "A two-colour co-localisation series with genetic distance as the independent variable. This tests spatial fidelity, a stronger claim than mere detection.",
          },
        },
        {
          t: "We find that GamGFP foci co-localize with the TetR-mCherry focus, producing a yellow focus, about 80% of the time with the I-site 10 kb from the array. With 55 kb, 80 kb, and 2 Mb separating the I-site and <i>tetO</i> array, the mean distances between green and red foci increased to 0.45 μm, 0.52 μm, and to 0.57 μm respectively and the number of cells with overlapping (yellow) foci decreased.",
          n: {
            e: "When the break was close to the marker, green and red overlapped and looked yellow. Further away, the dots separated. Exactly what you'd expect.",
            r: "Green plus red equals yellow when they overlap. Overlap falls and physical distance rises as genetic distance rises — two measurements of the same fact, both moving the right way.",
            c: "Co-localisation frequency and mean interfocal distance vary inversely and monotonically with genetic separation, which is the predicted signature of faithful spatial reporting.",
          },
        },
        {
          t: "The percentages of co-localization were significantly different for 10, 55 and 80 kb (p=0.00003, 0.00001, and 0.00006) and <mark class=\"t\">not between 80 kb and 2.4 Mb (p=0.053)</mark>. These data imply that sites farther than 80 kb apart are not necessarily further apart in space within the bacterial nucleoid, at least not after the nucleoid has suffered double-strand cleavage.",
          n: {
            e: "One comparison just missed the usual cutoff for \"real difference\". Instead of ignoring that, they used it to say something about how DNA is folded up.",
            r: "p = 0.053 sits just on the wrong side of the conventional 0.05 line. It would have been easy to call it a \"trend\" and claim the difference. They accept it as not significant and reason from that instead.",
            c: "A non-significant result (p=0.053) accepted at face value and converted into a positive structural inference about nucleoid organisation beyond ~80 kb. Note the contrast with common treatment of marginal p-values.",
          },
        },
        {
          t: "Because red <i>tetO</i>-array foci label chromosomes, we can use the fraction of green (GamGFP) per red (chromosome) focus to approximate the efficiency of GamGFP focus formation at DSBs per chromosome. Using the construct in which the <i>tetO</i> array and I-site are nearby, at 55 kb away, we observe 0.82 ± 0.03 green per red focus, indicating a rough efficiency of 82% of DSBs with a focus. This is similar to our estimate of ∼71% of DSBs with a focus, above.</p>",
          n: {
            e: "This gives a second estimate of how many breaks the tool catches: 82%, close to the earlier 71%.",
            r: "Two completely different methods landed on 71% and 82%. Independent routes reaching similar answers is much stronger than either number alone.",
            c: "A second efficiency estimate by an orthogonal route. The authors themselves label it equivocal, but convergence with the dose-response estimate strengthens both.",
          },
        },
      ],
      figs: [
        {
          n: 3,
          src: "/figures/fig3.jpg",
          cap: "<b>Figure 3.</b> Subcellular/subgenomic localization of DSBs in living <i>E. coli</i>. (A) Strategy: the location of I-<i>Sce</i>I cleavage sites was varied relative to a fixed-position TetR-mCherry-bound <i>tetO</i> array. (B–H) Diagrams of chromosomes with I-sites engineered 10 kb, 55 kb, 80 kb, and 2.4 Mb from the array. (C, E, G, I) Representative fluorescence microscopy showing co-localization (yellow) at 10 kb and non-overlapping foci at greater distances. (J) Percentage of cells with overlapped foci at each distance. (K) Mean interfocal distances. Cells counted: 298, 10 kb; 204, 55 kb; 333, 80 kb; 1347, 2.4 Mb.",
          x: "<b>How to read it</b> A ruler experiment. <b>C, E, G, I</b> are the actual cells: in C the two colours sit on top of each other and merge to yellow; by I they are clearly two separate dots. <b>J</b> is the summary bar chart and it falls steeply from ~80% at 10 kb to nearly nothing at 2.4 Mb. <b>K</b> is the mirror image — distance between dots rising as J falls. Read them together: one goes down as the other goes up, which is the same fact seen twice. Also notice the caption states the number of cells counted for every condition. A figure that tells you its own n is making itself easier to check.",
        },
      ],
    },
    /* ── 7 · Results — the rate ── */
    {
      n: "Results — the rate",
      paras: [
        {
          h: "Generation-dependence and rate of spontaneous DNA breakage",
          t: "Previously, we estimated the steady-state frequency of proliferating <i>E. coli</i> with one or more spontaneous DSBs to be between 0.5% and ∼2.1%. However, two problems cloud interpretation of the previous data. First, the previous method could not distinguish whether most spontaneous DSBs occur singly in cells or via multi-break catastrophes. Second, whether spontaneous DSBs occur replication- and thus generation-dependently was unknown.",
          n: {
            e: "Older estimates had two holes: nobody knew if breaks came one at a time or in disasters, and nobody knew if they came from dividing.",
            r: "They're naming exactly what was wrong with their own earlier work. Both unknowns matter for calculating a real rate — you can't convert \"cells with breaks\" into \"breaks\" without knowing how many per cell.",
            c: "Self-critique of prior published estimates, identifying two confounds: unknown per-cell break multiplicity and unknown generation-dependence. Both are prerequisites for converting frequency into rate.",
          },
        },
        {
          t: "Time-lapse microfluidic imaging shows that most spontaneous DSBs form with precise correlation to numbers of cell divisions, and they form mostly 1 DSB per cell, not in multi-break catastrophes. In microfluidic chambers, we captured images of growing microcolonies from the 1-cell to ∼100-cell stage measuring divisions and appearance of spontaneous GamGFP foci while varying cell-division rates by withdrawal of glucose from the flowing medium.",
          n: {
            e: "They filmed single bacteria growing into colonies, then starved them to slow down dividing, and watched what happened to the dots.",
            r: "The design is the clever part: by changing how fast cells divide while time keeps passing normally, they can separate \"caused by dividing\" from \"caused by time\".",
            c: "The experiment decouples the two candidate independent variables. Varying division rate at constant elapsed time discriminates replication-dependent from time-dependent break formation.",
          },
        },
        {
          t: "If spontaneous DSBs form independently of replication/generations, then the focus appearance might correlate with time not generations, whereas replication-dependent mechanisms of DSB formation predict correspondence with generations. Cells kept dividing in log-phase for 9 hr, then shifted to no-glucose for an additional 18 hr, show severely slowed divisions after the shift, and a highly precise correspondence of the numbers of spontaneous DSB foci with numbers of cell divisions at all division rates.",
          n: {
            e: "Starve the cells so they stop dividing — and breaks stop appearing too. So breaks come from dividing, not from time passing.",
            r: "They stated both predictions <i>before</i> reporting the result, which is good practice. Breaks tracked divisions, not the clock. That's the paper's central finding.",
            c: "Competing predictions stated explicitly before the result. Focus accumulation tracked division number across a manipulated division-rate range, supporting replication-dependence.",
          },
        },
        {
          t: "To verify that the cells experiencing slow/no growth were still capable of forming GamGFP foci had breaks been present, we gave 20 μg/ml of DSB-producing agent phleomycin after 27 hr and found that 45 ± 5% of cells then formed GamGFP foci. Thus, new DSBs could have been detected if they had formed.",
          n: {
            e: "Smart double-check: maybe the starved cells just couldn't show breaks anymore? They forced breaks with a chemical — dots appeared. So the tool still worked.",
            r: "This closes the most obvious loophole. Without it, \"no dots in starved cells\" could mean \"no breaks\" <i>or</i> \"tool stopped working\". Forcing breaks proves it was the former.",
            c: "A positive control against a false-negative interpretation. Demonstrating retained reporter competence in the starved state is essential to the generation-dependence claim.",
          },
        },
        {
          t: "In all six experiments summarized in Figure 4A, one focus appeared per cell, and cells with a focus did not divide further (probably because GamGFP is a DSE 'trap' that <mark class=\"t\">prevents repair of the break</mark>). Therefore, 0.0145 ± 0.006 foci per cell division represents the rate of formation of foci per division. Correcting this rate for ∼71% efficiency of detection of DSBs as foci provides a rate of 0.021 ± 0.008 DSBs per cell division.",
          n: {
            e: "Roughly one break every fifty divisions. But note two things: it rests on six colonies, and the tool blocks repair — it changes the very cells it's watching.",
            r: "The headline number. Two caveats sit right there in the text: n = 6, and focus-bearing cells stop dividing because the tool traps the break. The instrument is part of the experiment.",
            c: "The rate is corrected for detection efficiency, inheriting that parameter's uncertainty. Cell-cycle arrest in focus-bearing cells confirms repair blockade and constrains the tool to formation, not repair, kinetics. n=6 microcolonies.",
          },
        },
        {
          t: "Applying this function to an estimate of 0.01 of cells producing ≥1 DSBs per generation, we have 0.01 × 108/98 = 0.011 DSBs per cell division. This is similar to the 0.021 ± 0.008 DSBs per cell division obtained from the microfluidic data above, and both are far lower than initial estimates.",
          n: {
            e: "A totally different calculation gives a similar answer. Two roads, one destination — that's what makes a small experiment believable.",
            r: "This is what rescues n = 6. Re-analysing older data with the new knowledge gives 0.011, close to the 0.021 from filming. Independent methods agreeing is worth more than a bigger sample alone.",
            c: "Triangulation via re-derivation from independent flow-cytometric data, corrected using the newly established single-break multiplicity. Agreement within a factor of two across orthogonal methods substantially offsets the small microfluidic n.",
          },
        },
      ],
      figs: [
        {
          n: 4,
          src: "/figures/fig4.jpg",
          cap: "<b>Figure 4.</b> Generation-dependence of spontaneous GamGFP focus formation in proliferating <i>E. coli</i>. Log-phase GamGFP-pre-induced cells were loaded into a microfluidic chamber in which single cells anchor then divide to form microcolonies. Rapid growth in glucose during the first 9 hr was followed by washing cells in medium lacking glucose for 18 hr to slow and halt cell divisions. (A) Spontaneous DSB foci are correlated with numbers of cell divisions. Summary of data for six cells that became microcolonies. Blue, number of cell divisions; green, cumulative number of spontaneous foci. (B) Representative 2-hr micro-colony with a GamGFP focus. (C) Representative 15-hr micro-colony with GamGFP foci.",
          x: "<b>How to read it</b> Panel <b>A</b> carries the paper's biggest claim, and it's a <i>dual-axis</i> plot — two different measurements sharing one timeline. Blue (left axis) is cell divisions; green (right axis) is breaks. They rise together, bend together at the \"Starvation\" arrow, and flatten together. That shared shape <i>is</i> the argument: if time alone caused breaks, the green curve would have kept climbing after the blue one flattened. It didn't. <b>B</b> and <b>C</b> are the raw images behind the curves. One caveat to carry: the caption says this summarises six cells.",
        },
      ],
    },
    /* ── 8 · Results — mammalian cells ── */
    {
      n: "Results — mammalian cells",
      paras: [
        {
          h: "GamGFP binds laser- and IR-induced breaks and is inhibited by Ku",
          t: "We find that HeLa cells expressing GamGFP, in which DNA is sheared by a laser beam across the nucleus, display recruitment of fluorescence signal to the laser line. GamGFP co-localized with 53BP1 visualized by immunofluorescence staining in the same laser-treated and fixed samples.",
          n: {
            e: "In human cells, they drew a line of damage with a laser — and the tool gathered along exactly that line.",
            r: "Laser micro-irradiation lets you choose where the damage goes. If the signal appears along a line you drew, that's hard to explain any other way.",
            c: "Spatially defined damage provides a stringent positive control: recruitment must be confined to the irradiated track, and co-localisation with 53BP1 cross-validates against the established marker.",
          },
        },
        {
          t: "We found ∼three-fold better labeling of laser-induced DSBs in Ku-deficient cells (lacking Ku80) compared with heterozygous Ku80-competent cells or <i>Lig4<sup>−/−</sup></i> (end-joining-defective but Ku-competent) cells. Because GamGFP is inhibited by Ku even in end-joining-defective cells lacking LigIV, we infer that competition with Ku reduces GamGFP recruitment to DSBs independently of NHEJ.",
          n: {
            e: "Another protein, Ku, fights the tool for the same broken ends. When Ku is missing, the tool works three times better.",
            r: "The Lig4 comparison is the clever control. It separates two explanations: is Ku blocking the tool, or is repair removing breaks? Lig4 cells can't repair but still have Ku — and the tool is still blocked. So it's competition.",
            c: "The <i>Lig4<sup>−/−</sup></i> comparison dissociates end-binding competition from NHEJ-mediated substrate depletion, isolating steric competition as the mechanism of Ku inhibition.",
          },
        },
        {
          h: "Incomplete 53BP1 co-localization with GamGFP",
          t: "Though both GamGFP and 53BP1 form foci on Gamma-irradiated Ku80-deficient MEFs, <mark class=\"t\">only ∼31% of foci per cell were coincident 53BP1 and GamGFP</mark>. About 46% showed only 53BP1 and ∼23% showed only GamGFP. The coincident foci of GamGFP with γ-H2AX and 53BP1 validate both of these markers as genuine DSB markers.",
          n: {
            e: "Their tool and the standard marker only agree about a third of the time. That's a big disagreement, and they report it in full.",
            r: "This is where the paper is most exposed. A 31% overlap could mean their tool misses breaks, or that the old marker flags places without breaks. They publish the full breakdown either way.",
            c: "The asymmetric disagreement (31% coincident, 46% 53BP1-only, 23% Gam-only) is reported in full. Either interpretation is available from these data alone; the authors argue for specificity but supply the numbers for the opposite reading.",
          },
        },
        {
          t: "This result is expected because, first, Gam is specific for flush DSEs with up to a four-base single-strand DNA overhang, not the long single-strand DNA overhangs created by resection of DSBs by repair exonucleases. Second, 53BP1 is expected to have a post-DSB-repair presence because it binds modified nucleosomes rather than DNA. The mechanism that predominates remains to be determined.",
          n: {
            e: "They explain why: Gam only grabs clean ends, and the old marker sticks around after repair. Then they admit they don't know which explanation matters more.",
            r: "They give a <i>mechanism</i> you can evaluate rather than just asserting their tool is better — and then explicitly say the question isn't settled. That combination is what a trustworthy argument looks like.",
            c: "A mechanistic account with testable structure: substrate-specificity limits for Gam (flush ends, ≤4-base overhang) versus persistence for 53BP1 (nucleosome binding). The concluding hedge is appropriate given both explanations remain live.",
          },
        },
        {
          h: "GamGFP inhibits IR-induced end resection",
          t: "We quantified RAD51 foci (single-stranded DNA) induced by IR in S-G2 cells that either were or were not simultaneously transfected with the GamGFP vector. We observed an inverse correlation between RAD51 foci and GamGFP-positive cells. These data indicate exclusivity of the presence of GamGFP and resection, implying that as in <i>E. coli</i>, GamGFP blocks exonuclease activity at DSEs in mammalian cells.",
          n: {
            e: "Cells making the tool had far fewer signs of DNA being trimmed back — more evidence the tool blocks repair.",
            r: "Note the design: both cell populations came from the <i>same</i> transfection, so they had identical radiation and handling. The only difference is whether that cell took up the construct. That's an unusually clean internal control.",
            c: "Within-transfection comparison eliminates batch, dose and handling confounds. The inverse relationship between GamGFP positivity and RAD51 focus number indicates resection blockade, consistent with the bacterial exonuclease-blocking result.",
          },
        },
      ],
      figs: [
        {
          n: 5,
          src: "/figures/fig5.jpg",
          cap: "<b>Figure 5.</b> GamGFP marks DSBs in mammalian cells and is inhibited by Ku. (A) GamGFP co-localizes with 53BP1 on laser-induced DNA breaks. (B) Ku inhibits recruitment of GamGFP to laser-induced damage, live cells. (C and D) Ku inhibits recruitment of GamGFP, fixed cells. Mean ± SEM of three experiments, n &gt;25 cells each. (E) GamGFP forms IR-induced foci in Ku80-defective MEFs. (F) Zoomed image from E. (G) IR-induced foci containing Gam only, 53BP1 only or both (&gt;2600 total foci counted in three independent experiments). Scale bars = 5 μm.",
          x: "<b>How to read it</b> Cell nuclei in several colours — green is GamGFP, red is 53BP1. In <b>A</b> a laser was drawn across the nucleus as a stripe, and both colours light up along that stripe. The researchers chose where the damage would be, so the signal had to appear there or the tool had failed. <b>D</b> is a two-bar chart: cells lacking Ku recruit about three times more GamGFP. <b>G</b> is the panel to slow down on — each dot is a cell, plotted in three columns (Gam only, 53BP1 only, both). The columns overlap far less than you'd expect. The authors could have shown only the agreement and quietly dropped this.",
        },
        {
          n: 6,
          src: "/figures/fig6.jpg",
          cap: "<b>Figure 6.</b> GamGFP inhibits IR-induced RAD51 foci, apparently blocking end resection. (A) GamGFP-positive Ku80-defective MEFs display reduced RAD51 foci upon IR treatment in S/G2 cells. S/G2 cells were identified by positive staining of CyclinA. (B) Quantification of RAD51 foci in CyclinA-positive cells with or without GamGFP production (cumulative values from three experiments with &gt;75 cells total). Each cell is 'Z-stacked' so that all RAD51 foci were examined.",
          x: "<b>How to read it</b> Panel <b>B</b> is a distribution comparison and repays a careful look. The x-axis bins cells by how many RAD51 foci they contain (0–5, 6–10, and so on); green bars are cells making GamGFP, black bars are cells that aren't. The two distributions are pushed apart — green towers over the 0–5 bin, black dominates every higher bin. Both populations came from the <i>same</i> transfection, so they had identical radiation and handling. That's about as clean an internal control as cell biology allows.",
        },
      ],
    },
    /* ── 9 · Results — APOBEC3A & G1 ── */
    {
      n: "Results — APOBEC3A & G1",
      paras: [
        {
          h: "APOBEC3A induces DSBs in human cells",
          t: "APOBEC3A is one of the most potent members of a family of DNA cytosine deaminase enzymes. We find that GamEmGFP forms foci in ∼35% of cells when GamEmGFP and APOBEC3A are co-induced, and many of the GamEmGFP foci co-localize with 53BP1.",
          n: {
            e: "They switched on a human enzyme that chemically changes DNA letters, and breaks appeared in about a third of cells.",
            r: "A deaminase chemically alters cytosine, one of the four DNA letters. The suspicion was that this eventually leads to breaks — this tests it directly.",
            c: "APOBEC3A is a single-stranded DNA cytosine deaminase implicated in cancer mutational signatures. Focus formation in ~35% of co-induced cells establishes association; the mutant control that follows establishes dependence.",
          },
        },
        {
          t: "<mark class=\"t\">The appearance of foci requires the catalytic glutamate of ABOBEC3A, strongly implying</mark> that DNA cytosine deamination leads to DSBs in human cells. As in MEFs, incomplete localization of 53BP1 with GamEmGFP implies that some 53BP1-bound sites may not have had Gam-recognizable DSBs.",
          n: {
            e: "They also tried a version of the enzyme with one tiny piece broken so its chemistry doesn't work — and the breaks didn't appear.",
            r: "This is the cleanest control in the paper. Same protein, same amount, same location — only the chemical activity disabled. Foci vanish. That narrows the cause to the chemistry itself.",
            c: "The catalytic-glutamate mutant is an isogenic negative control that holds expression, localisation and abundance constant while ablating deaminase activity. Note the authors still write \"strongly implying\" — appropriate for overexpression in transfected cells.",
          },
        },
        {
          h: "Spontaneous DSBs in G1 phase",
          t: "Most spontaneous DSBs are thought to occur during S-phase. However, 53BP1 forms unusually large nuclear foci exclusively in a subset of undamaged G1 cells. We examined the large nuclear 53BP1 foci in undamaged cells and find that ∼60% of the 53BP1 foci in Ku80-deficient cells correspond to genuine GamGFP-detectable DSBs.",
          n: {
            e: "Cells that weren't copying their DNA still had real breaks — about 60% of the suspicious spots turned out to be genuine.",
            r: "This settles a standing puzzle. People had seen large marker-spots in non-dividing cells but couldn't tell if they were real breaks. Now roughly 60% are confirmed.",
            c: "Resolves an ambiguity in the 53BP1 literature: large G1 nuclear bodies had unknown DSB status because 53BP1 is not DSB-specific. GamGFP provides the independent confirmation.",
          },
        },
        {
          t: "Moreover, the GamGFP that coincides with 53BP1 foci contain multiple individual foci, implying that these DSBs may be in large multi-break clusters. Because GamGFP does not spread along DNA, it can resolve multiple nearby DSBs, which was not possible with 53BP1. These data indicate that some spontaneous DSBs form outside of S phase, and do so in clusters.",
          n: {
            e: "What the old marker showed as one big blob turned out to be several separate breaks bunched together.",
            r: "This is the payoff of the resolution advantage from the introduction. Because the tool doesn't smear along the DNA, it can separate breaks that the old marker merged into one.",
            c: "The non-spreading property predicted in the introduction delivers substructure resolution here — a case where a stated design advantage produces a specific novel observation rather than merely a cleaner version of an old one.",
          },
        },
      ],
      figs: [
        {
          n: 7,
          src: "/figures/fig7.jpg",
          cap: "<b>Figure 7.</b> APOBEC3A induces DSBs in human cells. (A) HeLa cells co-transfected with GamEmGFP and APOBEC3A-mCherry or catalytic mutant, APOBEC3A-E72A-mCherry. (B) Summary of foci observed in cells producing both GamEmGFP and A3A-mCherry or A3A-E72A-mCherry (two independent experiments; n = 100 per experiment). (C) Mean number of foci per focus-positive cell.",
          x: "<b>How to read it</b> The cleanest control in the paper, shown as two rows of images. The top row (<b>A3A</b>) is the working enzyme — the green channel is full of distinct dots. The bottom row (<b>E72A</b>) is the identical enzyme with a single amino acid changed so its chemistry no longer works, and the green channel is a smooth, empty glow. Two rows, one letter of difference. <b>B</b> turns that into stacked bars and the contrast is stark: the E72A column is almost entirely grey \"no foci\". Note the caption gives the n — two experiments, 100 cells each. Modest, but stated rather than hidden.",
        },
        {
          n: 8,
          src: "/figures/fig8.jpg",
          cap: "<b>Figure 8.</b> Spontaneous DNA breakage in G1-phase cells: GamGFP shows large spontaneous G1 53BP1 foci to contain multi-break clusters. The large spontaneous 53BP1 foci in undamaged cells, which occur solely in G1, contain multiple DSBs that are marked by GamGFP. The GamGFP-53BP1 co-localization is more apparent in the absence of Ku. Data are from three (Ku80-proficient) or four (Ku80-defective) independent experiments of &gt;25 cells each with Z-stacked nuclei.",
          x: "<b>How to read it</b> A single large red 53BP1 blob in an undamaged nucleus — and in the green channel, that one blob resolving into several separate dots. That's the finding in one image: what the older marker showed as one break is actually a cluster. The bar chart compares co-localisation with and without Ku, and it's higher without Ku — exactly as the competition result in Figure 5 predicts. That consistency between two independent figures is quiet evidence both are measuring something real.",
        },
      ],
    },
    /* ── 10 · Discussion ── */
    {
      n: "Discussion",
      paras: [
        {
          t: "We showed that fluorescent-protein-fusion derivatives of the highly DSE-specific Gam protein of phage Mu allow direct identification of DSBs in bacterial and mammalian cells. <mark class=\"t\">GamGFP detects about 71–82% of DSBs, a robust efficiency.</mark>",
          n: {
            e: "The tool finds roughly 71–82% of breaks — most, but not all.",
            r: "The range comes from the two independent estimates. Calling it \"robust\" is a judgement call, but the honest thing is that it also means a fifth to a third are missed.",
            c: "The composite 71–82% range spans two partly independent estimates. \"Robust\" is defensible for a novel reporter but the complementary miss rate should be carried into any quantitative use.",
          },
        },
        {
          t: "In mammalian cells, GamGFPs may have considerable utility as a marker for DSBs, particularly when levels of DNA insults/damage are high. However, we note that a failure to detect DSBs using Gam may be due to competition with Ku and/or to relatively low levels of DNA damage. Additionally, in mammalian cells GamGFP foci were more dramatic in fixed than living cells.",
          n: {
            e: "They warn that not seeing a dot doesn't prove there's no break — Ku might have got there first.",
            r: "This is a serious limitation stated plainly. It means the tool gives reliable positives but unreliable negatives, which constrains what experiments you can use it for.",
            c: "An explicit asymmetry between positive and negative predictive value. Ku competition renders negative results uninterpretable, and the fixed-versus-live discrepancy suggests background subtraction affects apparent signal.",
          },
        },
        {
          t: "In work published while this paper was in review, Britton et al. (2013) use Ku foci for detection of DSBs similarly to our use of GamGFP. An advantage of Ku is that competition with Ku is not a problem, whereas an advantage of GamGFP is its greater specificity for double-strand ends.",
          n: {
            e: "Another team published a rival method while this was being reviewed. The authors mention it and say what it does better than theirs.",
            r: "They didn't have to include this. Naming a competitor and conceding a specific advantage to it is a strong honesty signal, and rare.",
            c: "Voluntary disclosure of concurrent competing work with a balanced advantage comparison. This is a discretionary inclusion that improves the reader's ability to choose between methods.",
          },
        },
        {
          t: "Third, we demonstrate directly that primate-specific deaminase APOBEC3A caused GamGFP foci, and thus DSBs in human cells. Regardless of the specific mechanisms, the data indicate that cytosine-deamination may be a general mechanism of DSB generation in mammalian cells.",
          n: {
            e: "They're confident about the enzyme result — note \"demonstrate directly\" here versus softer words elsewhere.",
            r: "Watch the verb shift. Elsewhere they write \"supporting\" and \"implying\"; here it's \"demonstrate directly\", because the catalytic mutant control earns a stronger claim.",
            c: "The verb escalation to \"demonstrate directly\" is licensed by the isogenic mutant control, in contrast to the correlational generation-dependence result. The subsequent generalisation is hedged with \"may be\".",
          },
        },
        {
          t: "In <i>E. coli</i>, GamGFP allowed demonstration that spontaneous DNA breakage is precisely correlated with the number of cell divisions, providing the first evidence that most spontaneous breakage results from DNA replication-based mechanisms. However, nearly all of the work required engineered constructs or situations or mutant proteins, and so did not address how <i>spontaneous</i> DSBs occur normally.",
          n: {
            e: "This is the first evidence that most natural breaks come from DNA copying in ordinary cells.",
            r: "Read the second sentence carefully — it's about <i>previous</i> work, not theirs. Earlier studies used rigged systems; this one looked at normal cells.",
            c: "The claim to priority rests on the distinction between sufficiency in engineered systems and typicality in unperturbed cells. That distinction is what \"first evidence\" is doing work on.",
          },
        },
        {
          t: "These true rates are 10–20-times lower than initial postulates, but in line with each other. Because genomic rearrangement frequencies remain the same regardless of estimations of DSB numbers, these rarer and more accurate break rates imply that each DSB is 10–20 times more genome destabilizing than had initially been postulated. Spontaneous DSBs are infrequent but dangerous.",
          n: {
            e: "Breaks are rarer than people thought — but the damage they cause hasn't changed. So each break must be far more dangerous than assumed.",
            r: "This conclusion comes from arithmetic, not a new experiment. Same damage divided among fewer breaks means more damage per break. It's valid, but it inherits every assumption from both numbers.",
            c: "A derived rather than measured conclusion: holding rearrangement frequency fixed while revising break rate downward by 10–20× necessarily scales per-break destabilising potential by the same factor. Its reliability is bounded by the weaker of the two inputs.",
          },
        },
      ],
      figs: [
      ],
    },
    /* ── 11 · Funding & disclosures ── */
    {
      n: "Funding & disclosures",
      paras: [
        {
          h: "Competing interests",
          t: "The authors declare that no competing interests exist.",
          n: {
            e: "Nobody involved stands to profit from the result being true.",
            r: "A competing-interests declaration is where financial or professional conflicts get disclosed. \"None\" is the cleanest possible statement here.",
            c: "A null competing-interests declaration. Note this covers declared financial and professional conflicts only; it does not address career or reputational incentives.",
          },
        },
        {
          h: "Funding",
          t: "National Institute of Health Director's Pioneer Award (DP1-CA174424, Susan M Rosenberg); Cancer Prevention Research Institute of Texas (R1116, Kyle M Miller); National Institutes of Health (R01-GM53158, Susan M Rosenberg; F32-GM095267, Ryan L Frisch; CA127945 and CA097175, Lei Li; R01-GM88653, Christophe Herman; R01-GM102679, David Bates; R01-AI064046 and P01-GM091743, Reuben S Harris).",
          n: {
            e: "All the money came from public research agencies — no company paid for this.",
            r: "Every grant is itemised by number and named investigator. That specificity matters: a vague acknowledgement is much harder to verify than a grant number you can look up.",
            c: "Fully itemised public funding from NIH and CPRIT with grant numbers and named investigators. No commercial sponsor appears, and no party's revenue depends on the conclusion.",
          },
        },
        {
          t: "<mark class=\"t\">The funders had no role in study design, data collection and interpretation, or the decision to submit the work for publication.</mark>",
          n: {
            e: "The people who paid had no say in how the study was run or what it concluded.",
            r: "This is the funder-independence statement. It's standard, but its absence would be a red flag — so its presence is worth registering.",
            c: "The standard independence declaration. Routine in publicly funded work; conspicuous by absence in industry-sponsored studies.",
          },
        },
        {
          h: "Review and publication",
          t: "Received: 12 July 2013. Accepted: 16 September 2013. Published: 29 October 2013. Reviewing editor: Johannes Walter, Harvard Medical School, United States.",
          n: {
            e: "Other scientists checked this before it was published, and the editor who ran that check is named.",
            r: "Peer-reviewed, not a preprint. The full timeline and a named reviewing editor are both signs of an accountable process.",
            c: "A ~3.5-month submission-to-publication interval with a named reviewing editor. eLife's model publishes editor identity, which is more accountable than anonymous handling.",
          },
        },
        {
          h: "Licence",
          t: "Copyright Shee et al. This article is distributed under the terms of the Creative Commons Attribution License, which permits unrestricted use and redistribution provided that the original author and source are credited.",
          n: {
            e: "This paper is free for anyone to read, share and reuse — which is why it can appear here in full.",
            r: "CC-BY is the most permissive open licence. It's the reason FirstPaper can reproduce the complete text and figures rather than short excerpts.",
            c: "CC-BY permits redistribution and derivative use with attribution. Note that \"free to read\" is not the same as CC-BY — always check the licence before reusing a paper's content.",
          },
        },
      ],
      figs: [
      ],
    },
  ],

  quiz: [
    {
      q: "What does the Gam part of GamGFP actually stick to?",
      o: [
        { t: "Broken DNA ends", c: 1, f: "Right — that's the whole design. Gam grabs double-strand ends, GFP makes them visible." },
        { t: "Any protein it bumps into", c: 0, f: "The opposite — Gam was chosen precisely <i>because</i> it doesn't bind other proteins." },
        { t: "The outside of the cell", c: 0, f: "It works inside, on the chromosome itself." },
      ],
    },
    {
      q: "In the GFP-only control, what happened?",
      o: [
        { t: "Spots appeared just as brightly", c: 0, f: "The reverse — under 0.03% of cells, essentially none." },
        { t: "Almost no spots formed", c: 1, f: "Exactly. Without the grabber, the glow alone makes no dots — so dots mean breaks." },
        { t: "The cells died right away", c: 0, f: "GFP alone caused no drop in viability." },
      ],
    },
    {
      q: "Why run BOTH a virus test and a UV test?",
      o: [
        { t: "The first one failed", c: 0, f: "Both worked. They were run together on purpose." },
        { t: "The two fail in different ways, so agreement is much harder to fake", c: 1, f: "Yes — converging evidence. A quirk of virus biology wouldn't also produce a UV survival curve." },
        { t: "To use up leftover materials", c: 0, f: "Two independent routes to one conclusion is a deliberate strategy." },
      ],
    },
    {
      q: "When cells were starved and stopped dividing, what happened to breaks?",
      o: [
        { t: "They kept appearing at the same rate", c: 0, f: "That's what a time-driven model predicts — and it's not what happened." },
        { t: "Break appearance slowed along with division", c: 1, f: "Right, and that's the key result: breaks track generations, not the clock." },
        { t: "Every cell died", c: 0, f: "They survived — phleomycin later produced dots in 45% of them." },
      ],
    },
    {
      q: "What was the phleomycin step for?",
      o: [
        { t: "To prove the tool could still detect breaks in starved cells", c: 1, f: "Exactly — it rules out 'we saw nothing because the tool stopped working.'" },
        { t: "To kill the bacteria at the end", c: 0, f: "It's a break-inducing agent used as a positive check." },
        { t: "To make dots glow brighter", c: 0, f: "It creates breaks; brightness isn't the point." },
      ],
    },
  ],

  judge: [
    {
      mode: "calibrate-verb",
      bk: "verb",
      q: "The abstract says results are \"supporting\" replicative models. Why not \"proving\"?",
      th: "Read the paper's own verb, not the green note underneath it.",
      o: [
        { t: "They're being modest — they really did prove it", c: 0, f: "Hedging isn't politeness. It's a claim about evidence strength; read it literally." },
        { t: "A correspondence with divisions is strong evidence, but not a mechanism caught in the act", c: 1, f: "Exactly. They saw a pattern; they never watched a replication fork snap a chromosome." },
        { t: "The result wasn't statistically significant", c: 0, f: "The correspondence is tight. The hedge is about what the <i>design</i> can conclude." },
      ],
      tk: "Read the verbs before the findings. Careful authors grade language to evidence — one confident verb for everything is a warning sign.",
    },
    {
      mode: "spot-control",
      bk: "control",
      q: "What alternative explanation does the GFP-only control kill?",
      th: "A control exists to murder one specific rival explanation. Which one?",
      o: [
        { t: "That DNA breaks cause cancer", c: 0, f: "No cancer outcome is measured anywhere here." },
        { t: "That the glowing protein clumps by itself, making dots unrelated to breaks", c: 1, f: "Yes — the single most dangerous rival explanation for the whole paper, killed with one condition." },
        { t: "That the cells grew too slowly", c: 0, f: "Growth rate is handled elsewhere; not what this control tests." },
      ],
      tk: "For every control, name the rival explanation it eliminates. If you can't name one, you've missed its point.",
    },
    {
      mode: "find-limitation",
      bk: "limit",
      q: "The tool blocks repair, and cells with a dot never divide again. Does that ruin the rate?",
      th: "Split it in two: how often breaks FORM, versus what happens after.",
      o: [
        { t: "Yes — the measurement is worthless", c: 0, f: "Too strong. They count the <i>moment</i> a break appears, which happens before repair could." },
        { t: "Not for the formation rate — but it can't tell you anything about repair, and it does alter the cells", c: 1, f: "Precisely calibrated. Appearance survives; everything downstream is perturbed." },
        { t: "It doesn't matter at all", c: 0, f: "It matters — a tool that changes what it measures always limits which questions it can answer." },
      ],
      tk: "Ask what a measuring tool does to the thing it measures. Sometimes the instrument is part of the experiment.",
    },
    {
      mode: "sample-size",
      bk: "sample",
      q: "The headline rate rests on six microcolonies. Six. What rescues it?",
      th: "Look for a second, independent route to the same number.",
      o: [
        { t: "Nothing — six is too few, discard it", c: 0, f: "Reasonable instinct, but check what else is in the paper before throwing it out." },
        { t: "A separate re-analysis of different data lands on a very close number", c: 1, f: "Yes — 0.021 from filming, 0.011 from re-analysing old data. Two roads, one destination." },
        { t: "Six is actually large for microbiology", c: 0, f: "It isn't. The rescue is convergence, not the number itself." },
      ],
      tk: "When n is small, hunt for an independent method reaching the same answer. Convergence buys more trust than sample size alone.",
    },
    {
      mode: "weigh-source",
      bk: "money",
      q: "Public funding, no competing interests declared. Can you stop being sceptical?",
      th: "Ask what a clean funding statement rules out — and what it leaves untouched.",
      o: [
        { t: "Yes — public funding means the science is correct", c: 0, f: "Funding shapes incentives, not correctness. Publicly funded work can still be wrong." },
        { t: "No — it closes one door (financial motive) and leaves every scientific question open", c: 1, f: "Exactly. Careers and ego are incentives too. That's why the controls still matter." },
        { t: "No — all funding biases equally, so it changes nothing", c: 0, f: "That flattens a real distinction. A funder who profits from the conclusion is a different case." },
      ],
      tk: "A clean funding statement rules out one failure mode, not all of them. Ask what a disclosure actually covers.",
    },
  ],

  plain: "<h3>The problem</h3>\n<p>Your DNA breaks all by itself — not from anything you did, just from the ordinary business of being alive. When both strands snap at once, that's a double-strand break, the most dangerous kind of DNA damage there is. These breaks help drive cancer, they drive evolution, and they help bacteria evolve resistance to antibiotics.</p>\n<p>Here's the strange part: nobody could count them. Every existing method either wasn't sensitive enough to catch breaks at natural levels, or wasn't specific — it detected proteins that <i>gather near</i> damage rather than the break itself. That's like identifying a car crash by counting ambulances nearby. Usually right, occasionally very wrong.</p>\n<div class=\"pull\">So going in, two basic questions were open: how often does DNA break on its own, and what causes most of it?</div>\n<h3>What they built</h3>\n<p>They took a protein called Gam, borrowed from a virus that infects bacteria. Gam has one useful obsession: it clamps onto broken double-strand DNA ends and ignores everything else. They fused it to GFP, the jellyfish protein that glows green. The result turns an invisible break into a bright dot under a microscope.</p>\n<h3>How they proved it works</h3>\n<p>This is most of the paper, and it's the part worth admiring. They didn't just show pretty dots — they attacked their own tool from four directions. They cut DNA at a chosen spot and watched dots appear there. They made the glowing protein <i>without</i> the grabbing part, and dots vanished. They increased radiation and watched dots rise in step. And they put a red marker at a known place on the chromosome and showed the dots appeared right beside it.</p>\n<h3>What they found</h3>\n<p>Then they filmed single bacteria dividing for hours. Breaks appeared in step with cell divisions — and when cells were starved so they stopped dividing, breaks stopped appearing too. That's the finding: breaks come from copying DNA, not from time passing. The rate works out to roughly one break every fifty divisions, far rarer than anyone had assumed.</p>\n<div class=\"pull\">And that rarity has a sting. Since the damage those breaks cause hasn't changed, but the number of breaks is 10–20× lower than thought, each individual break must be 10–20× more dangerous than anyone believed.</div>\n<h3>What it can't do</h3>\n<p>The tool catches about 71–82% of breaks, so it misses roughly a fifth to a third. Another protein called Ku competes for the same broken ends, meaning \"no dot\" doesn't reliably mean \"no break.\" And GamGFP traps the break so it can't be repaired — the instrument changes the thing it measures. Every one of these limits is stated by the authors themselves, which is precisely why the paper is easy to trust.</p>",

  badges: [
    { k: "verb", ic: "⚖️", nm: "Verb Calibrator", ds: "Spotted a hedge doing real work" },
    { k: "control", ic: "🔍", nm: "Control Spotter", ds: "Named what a control kills" },
    { k: "limit", ic: "📉", nm: "Limitation Hunter", ds: "Found where a method breaks" },
    { k: "sample", ic: "🧮", nm: "Number Sceptic", ds: "Questioned a small sample" },
    { k: "money", ic: "💰", nm: "Follow the Money", ds: "Read a funding statement right" },
  ],
};

export default dnaBreakageGamGFP;
