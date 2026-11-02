export interface RuleItem {
  id: string;
  ruleTitle: string;
  bengaliNote?: string;
  formula?: string;
  explanation: string;
  exampleCorrect: string;
  exampleIncorrect?: string;
  examTrap?: string;
  quickMemory?: string;
  priority: 'must' | 'important' | 'advanced'; // 🔴, 🟡, 🔵
  examSource?: string; // e.g. "38th BCS, DU Admission"
}

export interface ComparisonPair {
  termA: string;
  termB: string;
  ruleA: string;
  ruleB: string;
  exampleA: string;
  exampleB: string;
  bengaliTip: string;
}

export interface GrammarSection {
  id: string;
  number: number;
  title: string;
  bengaliTitle: string;
  category: 'core_speech' | 'verbs_tenses' | 'syntax_rules' | 'exam_traps' | 'final_revision';
  overview: string;
  priority: 'must' | 'important' | 'advanced';
  rules: RuleItem[];
  comparisons?: ComparisonPair[];
  tableData?: {
    headers: string[];
    rows: string[][];
  };
}

export const GRAMMAR_SECTIONS: GrammarSection[] = [
  // 1. PARTS OF SPEECH OVERVIEW & IDENTIFICATION
  {
    id: 'parts-of-speech',
    number: 1,
    title: 'Parts of Speech Overview & Position Rules',
    bengaliTitle: 'পদ প্রকরণ ও বাক্যে অবস্থানগত নিয়ম',
    category: 'core_speech',
    priority: 'must',
    overview: 'একটি বাক্যে ব্যবহৃত প্রতিটি অর্থপূর্ণ word-কে তার কাজ ও অবস্থান অনুযায়ী ৮ ভাগে ভাগ করা হয়। প্রতিযোগিতামূলক পরীক্ষায় শুধু সংজ্ঞা নয়, বাক্যের অবস্থান (Position) অনুযায়ী Parts of Speech শনাক্তকরণ সবচেয়ে বেশি আসে।',
    rules: [
      {
        id: 'pos-1',
        ruleTitle: 'Determiner + Noun / Determiner + Adj + Noun Pattern',
        bengaliNote: 'বাক্যে Determiner বা Article এর পরে একটিমাত্র শব্দ থাকলে তা Noun, দুটি থাকলে ১ম টি Adjective ও ২য় টি Noun হয়।',
        formula: 'Article/Det + (Word 1 = Noun) | Article/Det + (Word 1 = Adj) + (Word 2 = Noun)',
        explanation: 'Determiner (a, an, the, this, that, my, his, each, some ইত্যাদি) এর পরে একটিমাত্র word বসলে সেটি বাধ্যতামূলকভাবে Noun হবে। একাধিক word থাকলে শেষেরটি Noun এবং তার আগেরটি Adjective।',
        exampleCorrect: 'I walked for a while. (while = Noun) | This is the go of the world. (go = Noun)',
        exampleIncorrect: 'I walked for while. (Error)',
        examTrap: 'While বা Go সাধারণত Conjunction বা Verb হলেও Article এর পর একক শব্দ হিসেবে বসায় এরা 100% Noun।',
        quickMemory: 'Article + Single Word = Noun; Article + 2 Words = Adj + Noun; Article + 3 Words = Adv + Adj + Noun',
        priority: 'must',
        examSource: '35th BCS, DU A-Unit, RU'
      },
      {
        id: 'pos-2',
        ruleTitle: 'Preposition + Noun / Preposition + Adj + Noun',
        bengaliNote: 'Preposition এর পরে একটিমাত্র শব্দ থাকলে Noun, দুটি থাকলে ১ম টি Adjective ও ২য় টি Noun হয়।',
        formula: 'Preposition + Noun | Preposition + Adjective + Noun',
        explanation: 'Preposition এর পর একটিমাত্র word বসলে তা Noun (বা Gerund)। যদি Preposition এর পর কোন Noun না থাকে, তবে সেই Preposition টি স্বয়ং Adverb হয়ে যায়।',
        exampleCorrect: 'The sun has gone down. (down = Adverb) vs He ran down the hill. (down = Preposition)',
        exampleIncorrect: 'She sat on chair. (Must have determiner/article)',
        examTrap: 'Preposition এর পর object না থাকলে শব্দটি Adverb হয়ে যায় (e.g. Please come in -> in = Adverb)।',
        quickMemory: 'Prep + Object = Preposition; Prep without Object = Adverb!',
        priority: 'must',
        examSource: '38th BCS, Dental Admission'
      },
      {
        id: 'pos-3',
        ruleTitle: 'Adjective + -ly = Adverb vs Noun + -ly = Adjective',
        bengaliNote: 'সকল -ly যুক্ত শব্দ Adverb নয়! Noun এর সাথে -ly যুক্ত হলে তা Adjective হয়।',
        formula: 'Noun + ly = Adjective | Adjective + ly = Adverb',
        explanation: 'friendly, motherly, fatherly, brotherly, lovely, heavenly, scholarly, cowardly, manly, worldly, costly, unsightly শব্দগুলো Adjective, কারণ এরা Noun + ly দিয়ে গঠিত। এদের Adverb করতে হলে "in a friendly manner / way" লিখতে হয়।',
        exampleCorrect: 'He behaved in a friendly manner. (Correct) | She is a lovely girl. (lovely = Adjective)',
        exampleIncorrect: 'He behaved friendly with me. (Incorrect — friendly is an adjective, not an adverb)',
        examTrap: 'পরীক্ষায় "He spoke friendly" দিয়ে ভুল শনাক্ত করতে বলে। সঠিক হবে "He spoke in a friendly way"।',
        quickMemory: 'Friend(N)+ly = Adj; Quick(Adj)+ly = Adv',
        priority: 'must',
        examSource: '12th-38th BCS, BBA IBA'
      },
      {
        id: 'pos-4',
        ruleTitle: 'Same Word as Different Parts of Speech (High Yield)',
        bengaliNote: 'একই শব্দ বাক্যের ব্যবহারের উপর ভিত্তি করে একাধিক Parts of Speech হতে পারে।',
        formula: 'Check Syntactic Function (S, V, O, Modifier)',
        explanation: 'Water: "Water the plants" (Verb) vs "Drink clean water" (Noun). Fast: "He ran fast" (Adverb) vs "He kept a fast" (Noun) vs "He is a fast bowler" (Adj). Better: "I know better" (Adv) vs "This is a better plan" (Adj) vs "Respect your betters" (Noun) vs "Try to better your condition" (Verb).',
        exampleCorrect: 'The up train has left. (up = Adjective) | Stand up. (up = Adverb) | Ups and downs of life. (ups = Noun)',
        examTrap: 'Better, Round, Right, Still, Above শব্দগুলোর বিবিধ ব্যবহার বিসিএস ও ভার্সিটি ভর্তি পরীক্ষায় সর্বাধিক জিজ্ঞাসিত।',
        quickMemory: 'শব্দটি বাক্যে কী কাজ করছে (Modify করছে কাকে? নাকি কাজ বোঝাচ্ছে?) তা দিয়ে বিচার করুন।',
        priority: 'must',
        examSource: 'KU, RU, CU, 28th BCS'
      }
    ],
    comparisons: [
      {
        termA: 'Adjective',
        termB: 'Adverb',
        ruleA: 'Modifies Noun or Pronoun (tells which, what kind, how many)',
        ruleB: 'Modifies Verb, Adjective, or another Adverb (tells how, when, where, why, how much)',
        exampleA: 'She is a quick learner. (Modifies noun learner)',
        exampleB: 'She learns quickly. (Modifies verb learns)',
        bengaliTip: 'Noun/Pronoun এর অবস্থা/গুণ = Adjective; কাজ কীভাবে/কখন/কোথায় হচ্ছে = Adverb।'
      }
    ]
  },

  // 2. NOUN CLASSIFICATION & EXAM TRAPS
  {
    id: 'nouns-mastery',
    number: 2,
    title: 'Noun: Types, Countability & Conversion Traps',
    bengaliTitle: 'বিশেষ্য: প্রকারভেদ, গণনযোগ্যতা ও রূপান্তর',
    category: 'core_speech',
    priority: 'must',
    overview: 'Noun প্রধানত ২ প্রকার: Concrete ও Abstract। Concrete আবার ৪ প্রকার (Proper, Common, Collective, Material)। প্রতিযোগিতামূলক পরীক্ষায় Noun এর রূপান্তর (Proper/Abstract becoming Common) এবং Countable vs Uncountable সবচেয়ে বেশি আসে।',
    rules: [
      {
        id: 'noun-1',
        ruleTitle: 'Proper / Abstract / Material Noun Becoming Common Noun',
        bengaliNote: 'Proper, Material বা Abstract Noun এর পূর্বে Article (a, an, the) বসলে বা Plural হলে তা Common Noun হয়ে যায়।',
        formula: 'The / A + Proper/Material/Abstract Noun = Common Noun',
        explanation: 'যখন কারো সাথে তুলনা করা হয় (Proper Noun) বা নির্দিষ্ট করে বোঝানো হয় (Material/Abstract), তখন তা Common Noun এ রূপান্তরিত হয়। e.g. "Kazi Nazrul Islam is the Shelley of Bangladesh" — এখানে Shelley হচ্ছে Common Noun। "The kindness of Mohsin" — kindness এখানে Common Noun।',
        exampleCorrect: 'Nazrul is the Byron of Bangladesh. (Byron = Common Noun) | The water of the Padma is holy. (water = Common Noun)',
        exampleIncorrect: 'Nazrul is Byron of Bangladesh. (Missing "the")',
        examTrap: 'পরীক্ষায় জানতে চাওয়া হয়: "The jury" বা "The honesty of the girl" এ আন্ডারলাইন করা শব্দটি কোন Noun? উত্তর: Common Noun!',
        quickMemory: 'The + [Any Noun] + of = Common Noun Rule!',
        priority: 'must',
        examSource: '38th BCS, CU B-Unit, RU'
      },
      {
        id: 'noun-2',
        ruleTitle: 'Collective Noun vs Noun of Multitude',
        bengaliNote: 'Collective Noun অবিভক্ত থাকলে Singular Verb, কিন্তু সদস্যদের মধ্যে মতভেদ বা বিভাজন হলে Plural Verb নেয় (Noun of Multitude)।',
        formula: 'United = Singular Verb & It/Its | Divided = Plural Verb & They/Their',
        explanation: 'Jury, Committee, Audience, Team, Class যদি একমত থাকে তবে Verb ও Pronoun উভয়ই Singular (is, was, has, its)। কিন্তু যদি তাদের মধ্যে দ্বিমত বা ভিন্ন মতামত হয়, তবে Verb ও Pronoun উভয়ই Plural (were, have, their) হবে এবং একে Noun of Multitude বলে।',
        exampleCorrect: 'The jury was unanimous in its verdict. (United) | The jury were divided in their opinions. (Noun of Multitude)',
        exampleIncorrect: 'The jury were unanimous in its verdict. (Mismatch)',
        examTrap: 'The committee was / were able to agree on this question — একমত হলে was, ভিন্নমত হলে were।',
        quickMemory: 'Unanimous/United = IS/ITS; Divided/Differ = ARE/THEIR',
        priority: 'must',
        examSource: '10th BCS, 26th BCS, Dental'
      },
      {
        id: 'noun-3',
        ruleTitle: 'Uncountable Nouns Traps (Never take a/an, never take -s/-es)',
        bengaliNote: 'যেসব Noun গণনা করা যায় না, তাদের পূর্বে কখনো a/an বসে না এবং এদের Plural রূপ হয় না।',
        formula: 'No a/an + Uncountable Noun + Singular Verb (No -s/-es)',
        explanation: 'সবচেয়ে বেশি আসা Uncountable Nouns: Advice, Bread, Furniture, Luggage, Baggage, Information, Scenery, Poetry, Traffic, Machinery, Homework, Money, Soap, Hair (স্বাভাবিক অবস্থায়), Knowledge, Alphabet, Issue (সন্তানার্থে)।',
        exampleCorrect: 'He gave me some advice. / a piece of advice. | The scenery of Cox’s Bazar is charming.',
        exampleIncorrect: 'He gave me an advice / advices. | The sceneries of Chittagong are beautiful.',
        examTrap: 'কখনোই "furnitures", "informations", "sceneries", "poetries" লেখা যাবে না।',
        quickMemory: 'FLIP BS: Furniture, Luggage, Information, Poetry, Bread, Scenery — Always Singular Uncountable!',
        priority: 'must',
        examSource: '24th BCS, 38th BCS, DU Admission'
      },
      {
        id: 'noun-4',
        ruleTitle: 'Countable Counters for Uncountable Nouns',
        bengaliNote: 'Uncountable Noun-কে সংখ্যায় প্রকাশ করতে হলে Counter Word যোগ করতে হয়।',
        formula: 'a piece of / a bar of / a loaf of / an item of + Uncountable Noun',
        explanation: 'Bread -> a loaf of bread, two loaves of bread. Soap -> a bar/cake of soap. Furniture -> a piece of furniture, items of furniture. Advice -> a piece of advice. Information -> an item of information.',
        exampleCorrect: 'I bought two bars of soap yesterday. | He gave me three pieces of advice.',
        exampleIncorrect: 'I bought two soaps. | He gave me three advices.',
        examTrap: 'পরীক্ষায় আসে: "I need ___ soap to wash my dress." উত্তর: a bar of / a cake of / some soap (কখনোই a soap নয়)।',
        quickMemory: 'Soap = bar; Bread = loaf; Advice/Furniture = piece; Information = item/piece.',
        priority: 'important',
        examSource: 'BRUR, DU C-Unit'
      }
    ]
  },

  // 3. NUMBER: SINGULAR & PLURAL TRAPS
  {
    id: 'number-mastery',
    number: 3,
    title: 'Number: Latin/Greek Irregular Plurals & Invariables',
    bengaliTitle: 'বচন: ল্যাটিন ও গ্রীক অনিয়মিত বহুবচন ও অপরিবর্তনীয় রূপ',
    category: 'core_speech',
    priority: 'must',
    overview: 'বিসিএস ও বিশ্ববিদ্যালয় ভর্তি পরীক্ষায় সাধারণ -s/-es এর চেয়ে ল্যাটিন, গ্রীক ও অপরিবর্তনীয় বহুবচন থেকে সবচেয়ে বেশি প্রশ্ন আসে।',
    rules: [
      {
        id: 'num-1',
        ruleTitle: 'Latin Words ending in -um become -a in Plural',
        bengaliNote: '-um যুক্ত ল্যাটিন শব্দের বহুবচনে um উঠে a বসে।',
        formula: 'Singular (-um) -> Plural (-a)',
        explanation: 'Medium -> Media, Datum -> Data, Bacterium -> Bacteria, Curriculum -> Curricula, Memorandum -> Memoranda, Addendum -> Addenda, Stratum -> Strata, Ovum -> Ova, Ultimatum -> Ultimata, Corrigendum -> Corrigenda.',
        exampleCorrect: 'Data are stored in the server. (Modern English allows data as singular mass, but exam standard is plural). | Media have great power.',
        exampleIncorrect: 'Datas are stored. / Bacterias are harmful.',
        examTrap: 'Agendum -> Agenda (Agenda মূলত Plural, তবে আধুনিক ব্যবহারে অনেক সময় singular হিসেবেও ধরা হয়; পরীক্ষায় singular চাইলে agendum খুঁজবেন)।',
        quickMemory: 'UM -> A (Bacterium -> Bacteria, Datum -> Data, Medium -> Media)',
        priority: 'must',
        examSource: '39th BCS, DU, RU, CU'
      },
      {
        id: 'num-2',
        ruleTitle: 'Greek Words ending in -is become -es in Plural',
        bengaliNote: '-is যুক্ত গ্রীক শব্দের বহুবচনে is উঠে es বসে (উচ্চারণ দীর্ঘ "ইইজ")।',
        formula: 'Singular (-is) -> Plural (-es)',
        explanation: 'Analysis -> Analyses, Crisis -> Crises, Basis -> Bases, Thesis -> Theses, Hypothesis -> Hypotheses, Oasis -> Oases, Diagnosis -> Diagnoses, Synopsis -> Synopses, Axis -> Axes, Parenthesis -> Parentheses.',
        exampleCorrect: 'The doctor made several diagnoses. | We examined the hypotheses carefully.',
        exampleIncorrect: 'Economists are facing many crisises.',
        examTrap: 'Crises, Analyses, Theses শব্দগুলো বহুবচন, অনেকেই এদের singular মনে করে ভুল করে।',
        quickMemory: 'IS -> ES (Crisis -> Crises, Analysis -> Analyses)',
        priority: 'must',
        examSource: '16th BCS, Medical Admission'
      },
      {
        id: 'num-3',
        ruleTitle: 'Words ending in -us become -i in Plural',
        bengaliNote: '-us যুক্ত শব্দের বহুবচনে us উঠে i বসে।',
        formula: 'Singular (-us) -> Plural (-i)',
        explanation: 'Alumnus -> Alumni, Radius -> Radii, Focus -> Foci, Stimulus -> Stimuli, Syllabus -> Syllabi, Fungus -> Fungi, Locus -> Loci, Nucleus -> Nuclei, Cactus -> Cacti/Cactuses. [ব্যতিক্রম: Corpus -> Corpora, Genus -> Genera].',
        exampleCorrect: 'The alumni attended the reunion. | Draw circles of different radii.',
        exampleIncorrect: 'He is an alumni of Dhaka University. (Should be: alumnus)',
        examTrap: 'Alumnus (পুরুষ প্রাক্তনী) -> Alumni (বহুবচন); Alumna (মহিলা প্রাক্তনী) -> Alumnae (মহিলা বহুবচন)।',
        quickMemory: 'US -> I (Alumnus -> Alumni, Radius -> Radii, Stimulus -> Stimuli)',
        priority: 'must',
        examSource: '37th BCS, 38th BCS'
      },
      {
        id: 'num-4',
        ruleTitle: 'Words ending in -on become -a in Plural',
        bengaliNote: '-on যুক্ত গ্রীক শব্দের বহুবচনে on উঠে a বসে।',
        formula: 'Singular (-on) -> Plural (-a)',
        explanation: 'Criterion -> Criteria, Phenomenon -> Phenomena. পরীক্ষায় প্রায়ই আসে "What is the singular form of Criteria?" উত্তর: Criterion।',
        exampleCorrect: 'What are the criteria for admission? | Natural phenomena are unpredictable.',
        exampleIncorrect: 'This is a criteria. (Must be: This is a criterion)',
        examTrap: '"Phenomenons" বা "Criterias" সম্পূর্ণ ভুল রূপ।',
        quickMemory: 'ON -> A (Criterion -> Criteria, Phenomenon -> Phenomena)',
        priority: 'must',
        examSource: 'DU, JNU, RU Admission'
      },
      {
        id: 'num-5',
        ruleTitle: 'Singular & Plural Same (Invariable Form)',
        bengaliNote: 'কিছু Noun এর Singular ও Plural রূপ একই থাকে, কোন -s/-es যোগ হয় না।',
        formula: 'Singular form = Plural form',
        explanation: 'Sheep, Deer, Fish, Salmon, Trout, Aircraft, Hovercraft, Spacecraft, Offspring, Series, Species, Corps, Dice (আধুনিক ইংরেজি), Cannon.',
        exampleCorrect: 'Five deer and ten sheep were grazing in the field. | We saw two aircraft in the sky.',
        exampleIncorrect: 'Five deers and ten sheeps were grazing. | Two aircrafts landed.',
        examTrap: 'পরীক্ষায় আসে: "Five (deer) and ten (sheep) are grazing." কখনই deers বা sheeps হবে না।',
        quickMemory: 'Sheep, Deer, Fish, Aircraft, Offspring -> No "s" ever!',
        priority: 'must',
        examSource: '11th BCS, 40th BCS, Dental'
      },
      {
        id: 'num-6',
        ruleTitle: 'Plural in Form but Singular in Sense (Take Singular Verb)',
        bengaliNote: 'দেখতে Plural হলেও অর্থে Singular, তাই সর্বদা Singular Verb গ্রহণ করে।',
        formula: 'Nouns ending in -s + Singular Verb',
        explanation: 'Subjects/Disciplines: Mathematics, Physics, Economics, Politics, Ethics, Civics, Statistics (যখন বিষয় বোঝায়), Linguistics. Diseases: Measles, Mumps, Rickets. Games: Billiards, Darts, Dominoes. Others: News, Gallows, Innings.',
        exampleCorrect: 'Physics is a challenging subject. | No news is good news. | Measles is an infectious disease.',
        exampleIncorrect: 'Physics are my favorite subject. | The news are shocking.',
        examTrap: 'ব্যতিক্রম: Statistics যখন "তথ্য বা পরিসংখ্যান" এবং Politics/Economics যখন "রাজনৈতিক/অর্থনৈতিক দৃষ্টিভঙ্গি" বোঝায়, তখন Verb Plural হয়! (e.g. His politics are questionable).',
        quickMemory: 'News + Sciences (-ics) + Diseases = Singular Verb!',
        priority: 'must',
        examSource: '26th BCS, Primary Teacher'
      },
      {
        id: 'num-7',
        ruleTitle: 'Always Plural Nouns (Two-part objects & Groups)',
        bengaliNote: 'যেসব Noun সর্বদা দুটি অংশ নিয়ে গঠিত বা সমষ্টি বোঝায়, তারা সর্বদা Plural Verb নেয়।',
        formula: 'Always Plural Noun + Plural Verb',
        explanation: 'Two-part garments/tools: Scissors, Trousers, Glasses, Spectacles, Pliers, Tongs, Binoculars, Pants, Jeans. Group/Collection: Cattle, Police, People, Gentry, Poultry, Vermin, Folk, Clergy, Alms, Amends, Assets, Premises, Thanks, Tidings, Surroundings, Remains.',
        exampleCorrect: 'Cattle are grazing in the field. | The police have arrested the thief. | My spectacles are broken.',
        exampleIncorrect: 'Cattles are grazing. | The police has caught him. | A scissor is on the table.',
        examTrap: '"A pair of scissors" বললে Verb Singular হবে (The pair of scissors is on the table), কিন্তু শুধু "Scissors" বললে Plural (The scissors are sharp)।',
        quickMemory: 'Cattle, Police, People, Scissors, Trousers = ALWAYS PLURAL VERB!',
        priority: 'must',
        examSource: '17th BCS, 38th BCS, Bank PO'
      }
    ]
  },

  // 4. GENDER CLASSIFICATION & EXAM TRAPS
  {
    id: 'gender-mastery',
    number: 4,
    title: 'Gender: Irregular Pairs & Personification Rules',
    bengaliTitle: 'লিঙ্গ: গুরুত্বপূর্ণ রূপান্তর ও রূপক প্রয়োগের নিয়ম',
    category: 'core_speech',
    priority: 'important',
    overview: 'ইংরেজি ব্যাকরণে Gender চার প্রকার: Masculine, Feminine, Common, Neuter। পরীক্ষায় সবচেয়ে বেশি আসে প্রাণীদের বিশেষ পুংলিঙ্গ-স্ত্রীলিঙ্গ এবং সাহিত্যিক Personification (ব্যক্তিকরণ)।',
    rules: [
      {
        id: 'gen-1',
        ruleTitle: 'High-Frequency Exam Gender Pairs',
        bengaliNote: 'প্রতিযোগিতামূলক পরীক্ষায় ঘন ঘন আসা ব্যতিক্রমী পুংলিঙ্গ ও স্ত্রীলিঙ্গ জোড়া।',
        formula: 'Masculine <-> Feminine',
        explanation: 'Bachelor -> Spinster/Maid; Drake (পাতিহাঁস) -> Duck; Hart/Stag (হরিণ) -> Roe/Hind; Buck (মৃগ) -> Doe; Ram/Wether (ভেড়া) -> Ewe; Boar (শূকর) -> Sow; Bullock/Steer -> Heifer (বকনা বাছুর); Colt (ঘোড়ার বাচ্চা) -> Filly; Drone (পুরুষ মৌমাছি) -> Bee; Gander (রাজহাঁস) -> Goose; Fox -> Vixen; Wizard (জাদুকর) -> Witch; Monk/Friar -> Nun; Sloven (নোংরা পুরুষ) -> Slut; Beau (সুন্দর পুরুষ) -> Belle; Lad -> Lass; Earl/Count -> Countess; Czar -> Czarina; Testator -> Testatrix; Executor -> Executrix; Administrator -> Administratrix.',
        exampleCorrect: 'The feminine of "Drake" is "Duck". | The feminine of "Ram" is "Ewe".',
        examTrap: 'Ram এর স্ত্রীলিঙ্গ Ewe (উচ্চারণ: ইউ); Hart এর স্ত্রীলিঙ্গ Roe বা Hind; Drone এর স্ত্রীলিঙ্গ Bee।',
        quickMemory: 'Drake-Duck, Ram-Ewe, Hart-Hind, Gander-Goose, Boar-Sow, Fox-Vixen',
        priority: 'must',
        examSource: '34th BCS, 40th BCS, RU, CU'
      },
      {
        id: 'gen-2',
        ruleTitle: 'Personification: Strength as Masculine vs Beauty/Grace as Feminine',
        bengaliNote: 'তেজ, শক্তি, ধ্বংস বোঝাতে Masculine এবং সৌন্দর্য, মমতা, শান্তভাব বোঝাতে Feminine ধরা হয়।',
        formula: 'Power/Fierceness = He/His | Beauty/Gentleness/Vessel = She/Her',
        explanation: 'Masculine personified: Sun, Death, Time, War, Winter, Thunder, Anger, Love, Summer. Feminine personified: Moon, Earth, Nature, Spring, Liberty, Peace, Justice, Mercy, Hope, Ship, Country/Nation (e.g. Bangladesh, The Titanic).',
        exampleCorrect: 'The Sun sheds his beams on all. | The Moon hid her face behind the cloud. | The ship lost her mast in the storm.',
        exampleIncorrect: 'The Moon hid his face. | The Sun sheds its beams (when personified).',
        examTrap: 'পরীক্ষায় আসে: "The moon has hidden ___ face behind the clouds." অপশনে his/her/its থাকলে সঠিক উত্তর: her।',
        quickMemory: 'Sun/Death/Time = He; Moon/Earth/Nature/Ship = She',
        priority: 'must',
        examSource: 'CU, RU, 12th BCS'
      },
      {
        id: 'gen-3',
        ruleTitle: 'Common Gender vs Neuter Gender',
        bengaliNote: 'উভয়লিঙ্গ (Common) মানুষ বা প্রাণীর নর-নারী উভয়কে বোঝায়; Neuter অচেতন বস্তু ও ছোট শিশুদের বোঝায়।',
        formula: 'Common = Person (baby, child, cousin, teacher, friend, orphan, spouse, sibling) | Neuter = book, table, pen, insect, infant',
        explanation: 'Baby, Child, Lower Animals (dog, cat, mosquito) এর ক্ষেত্রে স্বাভাবিকভাবে Pronoun হিসেবে "it/its" ব্যবহৃত হয় যদি লিঙ্গ নির্দিষ্ট না থাকে। Spouse (স্বামী বা স্ত্রী), Sibling (ভাই বা বোন), Parent (পিতা বা মাতা) হলো Common Gender।',
        exampleCorrect: 'The child cried for its mother. | Sibling means a brother or a sister.',
        exampleIncorrect: 'The child cried for his mother. (Unless specified as a boy)',
        examTrap: '"The word sibling means — a) brother b) sister c) brother or sister." সঠিক উত্তর: brother or sister।',
        quickMemory: 'Sibling = brother or sister; Spouse = husband or wife; Parent = father or mother.',
        priority: 'important',
        examSource: '40th BCS, BRTA'
      }
    ]
  },

  // 5. PRONOUN: CASES, AGREEMENT & EXAM SHORTCUTS
  {
    id: 'pronoun-mastery',
    number: 5,
    title: 'Pronoun: 231 vs 123 Rule, Relative Pronouns & Antecedent',
    bengaliTitle: 'সর্বনাম: ক্রম নিয়ম (২৩১ বনাম ১২৩), আপেক্ষিক সর্বনাম ও অন্বয়',
    category: 'core_speech',
    priority: 'must',
    overview: 'Pronoun পরীক্ষায় ৩টি মূল ক্ষেত্র থেকে প্রশ্ন আসে: ১) একাধিক Person এর ক্রম, ২) Preposition ও Let এর পর Objective Case, ৩) Relative Pronoun (Who vs Whom vs That) ও Antecedent এর সাথে Verb এর মিল।',
    rules: [
      {
        id: 'pro-1',
        ruleTitle: 'Order of Pronouns: 231 Rule (Normal) vs 123 Rule (Fault/Guilt)',
        bengaliNote: 'সাধারণ কথায় ২য় -> ৩য় -> ১ম পুরুষ (231), কিন্তু দোষ বা অপরাধ স্বীকারে ১ম -> ২য় -> ৩য় পুরুষ (123) বসে।',
        formula: 'Normal: 2nd + 3rd + 1st Person (You, he and I) | Guilt/Fault: 1st + 2nd + 3rd (I, you and he)',
        explanation: 'সাধারণ বাক্যে: You, he and I are friends (Verb সর্বদা Plural হবে)। দোষ বা ভুল স্বীকারে: I, you and he are guilty / to blame / committed the crime.',
        exampleCorrect: 'You, he and I were present in the class. | I, you and he are to blame.',
        exampleIncorrect: 'I, you and he went to market. (Normal event must follow 231) | You, he and I are guilty.',
        examTrap: 'পরীক্ষায় Verb এর রূপ নিয়ে বিভ্রান্তি ছড়ায়: "You, he and I ___ (am/is/are) present." উত্তর: "are", কারণ তিনজন মিলে Plural Subject তৈরি করেছে।',
        quickMemory: 'ভালো কাজে ২৩১ (You, he and I); দোষের কাজে ১২৩ (I, you and he)!',
        priority: 'must',
        examSource: '10th, 24th, 35th BCS, Medical'
      },
      {
        id: 'pro-2',
        ruleTitle: 'Case after "Than", "As", "Preposition", and "Let"',
        bengaliNote: 'Than এবং As এর পর Subjective Form বসে; কিন্তু Preposition ও Let এর পর সর্বদা Objective Form বসে।',
        formula: 'Than/As + Subjective (I, he, she, they) | Let / Preposition + Objective (me, him, her, them)',
        explanation: 'আনুষ্ঠানিক গ্রামারে তুলনার সময়: "He is taller than I (am)." "She is as clever as he (is)." অপরদিকে Let এবং Preposition এর পর: "Let you and me go." "Between you and me, there is no secret."',
        exampleCorrect: 'He is older than I. | Between you and me, he is a fraud. | Let him and me do the work.',
        exampleIncorrect: 'He is older than me. (Informal only, exam standard: than I) | Between you and I. | Let he and I go.',
        examTrap: '"Between you and I" একটি অতি সাধারণ ভুল যা পরীক্ষায় বারবার আসে; সঠিক হবে "Between you and me"।',
        quickMemory: 'Let + me/him/them (Object); Between + you and me (Object); Than + I/he/she (Subject)',
        priority: 'must',
        examSource: '12th BCS, 38th BCS, IBA'
      },
      {
        id: 'pro-3',
        ruleTitle: 'Relative Pronoun: Who vs Whom vs Whose vs Which vs That',
        bengaliNote: 'ব্যক্তির Subjective হলে Who, Objective হলে Whom, Possessive হলে Whose; বস্তু/প্রাণীতে Which; আর All/Only/Superlative এর পর That বসে।',
        formula: 'Person + Verb -> Who | Person + Subject + Verb -> Whom | Person/Thing + Noun -> Whose',
        explanation: 'Who বাক্যে Verb এর Subject হিসেবে বসে (Who came here). Whom বাক্যে Verb বা Preposition এর Object হিসেবে বসে (The man whom I met). That বসে যখন Antecedent হিসেবে All, None, Any, The same, The only, Superlative Degree থাকে (All that glitters is not gold).',
        exampleCorrect: 'I know the man who called you. | The boy whom they thought was honest stole the money. | This is the only pen that I want.',
        exampleIncorrect: 'All which glitters is not gold. | The man which I saw.',
        examTrap: 'Intervening clause trap: "The man who I thought was honest" — এখানে "I thought" বাদ দিলে "was honest" এর Subject লাগে, তাই "who" হবে, "whom" নয়!',
        quickMemory: 'Who + Verb; Whom + Subject + Verb; All/Only/Superlative + THAT!',
        priority: 'must',
        examSource: '26th BCS, DU Admission, RU'
      },
      {
        id: 'pro-4',
        ruleTitle: 'One’s Duty vs His Duty (Pronoun Consistency)',
        bengaliNote: 'বাক্যের Subject হিসেবে "One" বসলে তার পরবর্তী Possessive সর্বদা "one’s" হবে, "his" বা "her" নয়।',
        formula: 'One -> one\'s / oneself (NEVER his / himself)',
        explanation: 'যদি বাক্যের শুরুতে "One" বসে অনির্দিষ্ট ব্যক্তি বোঝায়, তবে তার Pronoun ও Possessive হবে যথাক্রমে one এবং one’s। তবে "Everyone / Someone / Each" থাকলে his বা her বসে।',
        exampleCorrect: 'One should do one\'s duty. | Everyone must do his or her task.',
        exampleIncorrect: 'One should do his duty. | One must take care of their health.',
        examTrap: '"One should keep his promise" ভুল! সঠিক: "One should keep one’s promise"।',
        quickMemory: 'One -> One\'s; Everyone -> His/Her',
        priority: 'must',
        examSource: '23rd BCS, 38th BCS, Bank PO'
      }
    ]
  },

  // 6. VERBS: FINITE, NON-FINITE, LINKING, FACTITIVE & CAUSATIVE
  {
    id: 'verbs-mastery',
    number: 6,
    title: 'Verb Types: Transitive, Linking, Factitive & Causative',
    bengaliTitle: 'ক্রিয়া: সকর্মক, লিংকিং, ফ্যাকটিটিভ ও প্রযোজক ক্রিয়া',
    category: 'verbs_tenses',
    priority: 'must',
    overview: 'Verbs ইংরেজি ব্যাকরণের মেরুদণ্ড। প্রতিযোগিতামূলক পরীক্ষার প্রধান ট্র্যাপ: Linking Verb এর পর Adverb বসানো, Transitive বনাম Intransitive নির্ণয়ে ভুল করা, এবং Causative verb এর কাঠামো ভুল করা।',
    rules: [
      {
        id: 'v-1',
        ruleTitle: 'Linking / Copulative Verbs Take ADJECTIVES, Not Adverbs!',
        bengaliNote: 'Linking Verb এর পর Adverb বসে না, Subject এর অবস্থা বোঝাতে Adjective বসে।',
        formula: 'Subject + Linking Verb + Adjective (Subject Complement)',
        explanation: 'প্রধান Linking Verbs মনে রাখার কৌশল [AB FLRST]: Appear, Be/Become, Feel, Look, Remain, Sound/Smell/Stay/Seem, Taste. এরা কোনো কাজ না বুঝিয়ে Subject ও Complement এর মধ্যে সেতু তৈরি করে।',
        exampleCorrect: 'Honey tastes sweet. (NOT sweetly) | She looks beautiful. (NOT beautifully) | The rose smells nice.',
        exampleIncorrect: 'Honey tastes sweetly. | She looks beautifully.',
        examTrap: 'পরীক্ষায় প্রায়ই "The rose smells sweetly" অপশন থাকে। Smell একটি linking verb, তাই sweet (Adjective) হবে।',
        quickMemory: 'AB FLRST: Appear, Become, Feel, Look, Remain, Sound/Smell, Taste -> ALWAYS + ADJECTIVE!',
        priority: 'must',
        examSource: '10th BCS, 14th BCS, DU, RU'
      },
      {
        id: 'v-2',
        ruleTitle: 'Transitive vs Intransitive Verb ("The IT Test")',
        bengaliNote: 'Verb কে "কী (What)" বা "কাকে (Whom)" প্রশ্ন করে উত্তর পেলে Transitive, না পেলে Intransitive।',
        formula: 'Verb + Object (Noun/Pronoun) = Transitive | Verb + (No Object / Adverb / Prep) = Intransitive',
        explanation: 'সহজ টেকনিক: Verb এর পরে "it" বসিয়ে যদি অর্থপূর্ণ বাক্য হয়, তবে তা Transitive (Do it -> Transitive, Love it -> Transitive). যদি "it" বসালে অর্থহীন হয়, তবে Intransitive (Sleep it -> ভুল, তাই Sleep Intransitive; Go it -> ভুল, তাই Go Intransitive)।',
        exampleCorrect: 'The baby cried loudly. (cried = Intransitive) | He wrote a letter. (wrote = Transitive)',
        exampleIncorrect: 'The accident was happened. (Happen is intransitive, can NEVER be passive!)',
        examTrap: 'Intransitive Verb এর কখনো Passive Voice হয় না! (die, fall, happen, occur, arrive, sleep, belong).',
        quickMemory: 'Ask "What/Whom?" -> Answer found = Transitive; No answer = Intransitive.',
        priority: 'must',
        examSource: '29th BCS, 38th BCS'
      },
      {
        id: 'v-3',
        ruleTitle: 'Factitive Verbs & Double Object Voice Traps',
        bengaliNote: 'Factitive Object কখনো Passive Voice এ Subject হতে পারে না।',
        formula: 'Sub + make/elect/choose/call/appoint/name + Direct Obj + Factitive Obj/Complement',
        explanation: 'We made him captain. এখানে him হচ্ছে Direct Object এবং captain হচ্ছে Factitive Object (Complement)। Passive করার সময় শুধুমাত্র him কে Subject (He) করা যাবে; Captain কে Subject করা যাবে না।',
        exampleCorrect: 'He was made captain by us. | He was elected chairman.',
        exampleIncorrect: 'Captain was made him by us. (Completely incorrect)',
        examTrap: 'পরীক্ষায় আসে: "They elected him chairman." Passive কি হবে? উত্তর: "He was elected chairman", "Chairman was elected him" নয়।',
        quickMemory: 'Factitive Object (Title/Post) cannot become the Subject in passive voice!',
        priority: 'must',
        examSource: 'RU, JNU, Primary Headmaster'
      },
      {
        id: 'v-4',
        ruleTitle: 'Causative Verbs (Have, Make, Let, Get, Help) Formulas',
        bengaliNote: 'নিজে না করে অন্যকে দিয়ে কাজ করিয়ে নেয়ার কাঠামো।',
        formula: 'MAKE/LET: Person/Thing + V1 (Base) | HAVE: Person + V1, Thing + V3 | GET: Person + to+V1, Thing + V3 | HELP: Person + (to) + V1',
        explanation: '১. Make/Let: ব্যক্তি বা বস্তু যাই থাকুক Base form (V1). e.g. He made me drive the car. ২. Have: ব্যক্তি হলে V1, বস্তু হলে V3. e.g. I had him clean the room vs I had my car cleaned. ৩. Get: ব্যক্তি হলে to + V1, বস্তু হলে V3. e.g. I got him to wash the car vs I got the car washed.',
        exampleCorrect: 'I had my hair cut. | She got him to sign the deed. | He made us laugh.',
        exampleIncorrect: 'I had my hair to cut. | He made me to cry.',
        examTrap: 'Have এর পর ব্যক্তি থাকলে V1 (I had the plumber repair the tap), কিন্তু বস্তু থাকলে V3 (I had the tap repaired)। Get এর পর ব্যক্তি থাকলে to + V1!',
        quickMemory: 'Have + Person + V1 | Have + Thing + V3 | Get + Person + to+V1 | Get + Thing + V3 | Make/Let + Person/Thing + V1',
        priority: 'must',
        examSource: '15th, 24th, 37th BCS, IBA'
      }
    ]
  },

  // 7. NON-FINITE VERBS: GERUND, PARTICIPLE & INFINITIVE
  {
    id: 'non-finite-mastery',
    number: 7,
    title: 'Non-Finite Verbs: Gerund vs Participle vs Verbal Noun',
    bengaliTitle: 'অসমাপিকা ক্রিয়া: জিরান্ড, পার্টিসিপল ও ভার্বাল নাউন পার্থক্য',
    category: 'verbs_tenses',
    priority: 'must',
    overview: 'প্রতিযোগিতামূলক পরীক্ষায় সবচেয়ে বিভ্রান্তিকর টপিক: Verb + -ing কখন Gerund আর কখন Present Participle? এবং "Verbal Noun" কী?',
    rules: [
      {
        id: 'nf-1',
        ruleTitle: 'Gerund (Noun + Verb) vs Present Participle (Adj + Verb)',
        bengaliNote: 'V-ing যখন Noun এর কাজ করে তখন Gerund; যখন Adjective/Verb এর কাজ করে তখন Participle।',
        formula: 'Verb+ing = Subject/Object/Complement -> Gerund | Verb+ing = Modifies Noun / In continuous -> Participle',
        explanation: '১. "The IT Test": Verb এর স্থানে "It" বসালে অর্থ মিললে Gerund (I like reading -> I like it = Gerund). ২. "Noun এর উদ্দেশ্য": A sleeping pill = a pill for sleeping (উদ্দেশ্য বুঝালে Gerund). ৩. "Noun এর চলমান অবস্থা": A sleeping baby = a baby who is sleeping (অবস্থা বুঝালে Participle).',
        exampleCorrect: 'Walking is a good exercise. (Gerund) | I saw a flying bird. (Participle) | A rolling stone gathers no moss. (Participle)',
        exampleIncorrect: 'I look forward to hear from you. (Must be: hearing — gerund after preposition)',
        examTrap: '"A reading room" (room for reading = Gerund) বনাম "A reading boy" (boy is reading = Participle)। "A rolling stone" এ rolling হলো Participle।',
        quickMemory: 'For + V-ing অর্থ দিলে Gerund; Is + V-ing অর্থ দিলে Participle!',
        priority: 'must',
        examSource: '11th, 38th, 39th BCS'
      },
      {
        id: 'nf-2',
        ruleTitle: 'The Verbal Noun Formula: "The + V-ing + of"',
        bengaliNote: 'V-ing এর আগে The এবং পরে of থাকলে তাকে খাঁটি Verbal Noun বলে।',
        formula: 'The + Verb-ing + of + Noun = Verbal Noun',
        explanation: 'Verbal Noun শুধুই Noun এর কাজ করে, এতে Verb এর কোনো বৈশিষ্ট্য বাকি থাকে না। যদি The থাকে কিন্তু of না থাকে, তবে সেটি ভুল বাক্য।',
        exampleCorrect: 'The reading of history is interesting. (reading = Verbal Noun) | The writing of a good letter is difficult.',
        exampleIncorrect: 'The reading history is interesting. (Wrong without "of")',
        examTrap: 'অপশনে Gerund ও Verbal Noun উভয়ই থাকলে "The + V-ing + of" কাঠামোর জন্য Verbal Noun দাগানোই উত্তম।',
        quickMemory: 'The + V-ing + of = Verbal Noun (জোড়া ছাড়া হবে না)!',
        priority: 'must',
        examSource: '38th, 39th BCS, RU, CU'
      },
      {
        id: 'nf-3',
        ruleTitle: 'Verbs Followed Directly by Gerund (V-ing)',
        bengaliNote: 'কিছু নির্দিষ্ট Verb এর পর অন্য কোনো Verb আসলে সরাসরি -ing (Gerund) যুক্ত হয়।',
        formula: 'Verb + V-ing (Gerund)',
        explanation: 'High-frequency verbs: Admit, Anticipate, Appreciate, Avoid, Consider, Defer, Delay, Deny, Detest, Discuss, Dislike, Enjoy, Escape, Excuse, Finish, Forgive, Imagine, Keep, Mind, Miss, Postpone, Practise, Quit, Recall, Recollect, Recommend, Regret, Resist, Risk, Stop, Suggest, Tolerate, Understand.',
        exampleCorrect: 'Would you mind opening the door? | He avoided meeting me. | She enjoys reading historical fiction.',
        exampleIncorrect: 'He avoided to meet me. | Would you mind to open the door?',
        examTrap: '"Would you mind", "cannot help", "could not help", "look forward to", "with a view to" এর পর সর্বদা V-ing বসে।',
        quickMemory: 'Enjoy, Avoid, Mind, Finish, Suggest, Postpone -> ALWAYS + V-ing!',
        priority: 'must',
        examSource: '28th, 38th BCS, JNU, DU'
      },
      {
        id: 'nf-4',
        ruleTitle: 'Prepositional Phrases ending in "To" that take GERUND (V-ing)',
        bengaliNote: 'সাধারণত "to" এর পর V1 বসে, কিন্তু এই বিশেষ ফ্রেজগুলোতে to এর পর V-ing বসে।',
        formula: 'Phrase + to + Verb-ing',
        explanation: 'Look forward to, With a view to, Be used to, Get used to, Accustomed to, Addicted to, Confess to, Object to, In addition to, Devoted to, Adverse to, Prefer ... to ...',
        exampleCorrect: 'I look forward to hearing from you soon. | He came with a view to buying a book. | He is used to working hard.',
        exampleIncorrect: 'I look forward to hear from you. | He came with a view to buy a book.',
        examTrap: '"Used to + V1" অতীত অভ্যাস বোঝায় (I used to smoke). কিন্তু "Be verb / get + used to + V-ing" বর্তমান অভ্যাস বোঝায় (I am used to smoking)!',
        quickMemory: 'Look forward to / With a view to / Be used to / Addicted to + V-ing!',
        priority: 'must',
        examSource: '12th, 15th, 24th, 33rd, 37th BCS'
      },
      {
        id: 'nf-5',
        ruleTitle: 'Bare Infinitive (Infinitive Without "To")',
        bengaliNote: 'কিছু নির্দিষ্ট Verb এবং Idiom এর পর to বসে না, শুধু Verb এর Base Form বসে।',
        formula: 'Subject + Verb + Object + V1 (No "to")',
        explanation: '১. Verbs of Perception/Causation: Make, Let, See, Hear, Watch, Feel, Bid, Notice (Active voice এ). ২. Modal Idioms: Had better, Had rather, Would rather, Would sooner, Cannot but. ৩. Need not, Dare not (Semi-modal হিসেবে).',
        exampleCorrect: 'You had better go home now. | I made him write the letter. | I would rather die than beg.',
        exampleIncorrect: 'You had better to go home. | He made me to laugh. | I would rather to die than beg.',
        examTrap: 'Passive voice এ Make, See, Hear এর পর "to" ফিরে আসে (He was made to laugh by us), কিন্তু "Let" এর ক্ষেত্রে passive এ-ও to বসে না (He was let go)!',
        quickMemory: 'Had better / Would rather / Make / Let / Cannot but + BARE V1 (NO TO)!',
        priority: 'must',
        examSource: '26th, 38th BCS, Medical'
      }
    ]
  },

  // 8. ADJECTIVE: TYPES, ORDER & LATIN ADJECTIVES
  {
    id: 'adjectives-mastery',
    number: 8,
    title: 'Adjectives: OSASCOMP Order & Latin Comparative Traps',
    bengaliTitle: 'বিশেষণ: ক্রম (OSASCOMP) ও ল্যাটিন তুলনার বিশেষ নিয়ম',
    category: 'core_speech',
    priority: 'must',
    overview: 'Adjective noun/pronoun কে বিশেষায়িত করে। ভর্তি ও নিয়োগ পরীক্ষার সবচেয়ে সাধারণ প্রশ্ন: ১) একাধিক Adjective এর সঠিক ক্রম (Order), ২) ল্যাটিন তুলনামূলক শব্দ (-ior), ৩) Absolute Adjective।',
    rules: [
      {
        id: 'adj-1',
        ruleTitle: 'Order of Multiple Adjectives (OSASCOMP Formula)',
        bengaliNote: 'Noun এর পূর্বে একাধিক Adjective বসলে নির্দিষ্ট ক্রম মেনে বসাতে হয়।',
        formula: 'Opinion -> Size -> Age -> Shape -> Color -> Origin -> Material -> Purpose -> NOUN',
        explanation: '১. Opinion (beautiful, ugly, lovely, strange) -> ২. Size (large, small, tall) -> ৩. Age (old, young, antique) -> ৪. Shape (round, square, oval) -> ৫. Color (red, black, green) -> ৬. Origin (Italian, Japanese, American) -> ৭. Material (wooden, silk, leather) -> ৮. Purpose (running shoes, writing table).',
        exampleCorrect: 'She bought a beautiful (O) small (S) round (Sh) black (C) Japanese (Or) wooden (M) table. | A handsome tall young Indian man.',
        exampleIncorrect: 'She bought a wooden black beautiful small table.',
        examTrap: 'পরীক্ষায় আসে: "Choose the correct order: a ___ table." অপশন: an old round red / a red round old. সঠিক: an old (Age) round (Shape) red (Color) table.',
        quickMemory: 'O-S-A-S-C-O-M-P: Opinion, Size, Age, Shape, Color, Origin, Material, Purpose!',
        priority: 'must',
        examSource: 'DU A & C Unit, 35th BCS'
      },
      {
        id: 'adj-2',
        ruleTitle: 'Latin Adjectives ending in -ior take "TO", NEVER "THAN"',
        bengaliNote: '-ior দিয়ে শেষ হওয়া ৭টি ল্যাটিন Adjective এর পর সর্বদা "to" বসে, কখনোই "than" বসে না।',
        formula: 'Senior / Junior / Superior / Inferior / Prior / Anterior / Posterior + TO',
        explanation: 'এই শব্দগুলো জন্মগতভাবেই Comparative, তাই এদের পূর্বে more বা most বসে না এবং এদের পর than বসে না, বরং to বসে। একইভাবে "Preferable" শব্দটিও to নেয়।',
        exampleCorrect: 'He is senior to me by three years. | Death is preferable to dishonor. | This pen is inferior to yours.',
        exampleIncorrect: 'He is senior than me. | This cloth is more superior than that.',
        examTrap: 'কখনোই "more senior than" বা "superior than" লেখা যাবে না। সর্বদা "senior to / superior to"।',
        quickMemory: 'Senior, Junior, Superior, Inferior, Prior, Preferable -> ALWAYS "TO"!',
        priority: 'must',
        examSource: '11th, 23rd, 35th, 38th BCS'
      },
      {
        id: 'adj-3',
        ruleTitle: 'Absolute Adjectives (Cannot be Compared)',
        bengaliNote: 'কিছু Adjective চূড়ান্ত অবস্থা প্রকাশ করে, তাই এদের Comparative বা Superlative রূপ হয় না।',
        formula: 'No "more / most / very" before Absolute Adjectives',
        explanation: 'Unique, Perfect, Dead, Universal, Complete, Entire, Supreme, Chief, Round, Square, Fatal, Impossible, Infinite, Eternal, Golden, Final. কোনো কিছু হয় "unique", নয়তো নয়; "more unique" বা "most unique" ব্যাকরণগতভাবে ভুল।',
        exampleCorrect: 'This is a unique opportunity. (NOT most unique) | He is a perfect gentleman. | The event was supreme.',
        exampleIncorrect: 'This is the most unique idea. | He is more dead than alive.',
        examTrap: 'পরীক্ষায় আসে: "Which sentence is correct?" a) This is a unique case b) This is the most unique case. সঠিক উত্তর: a!',
        quickMemory: 'Unique, Perfect, Complete, Dead, Universal -> NO MORE / NO MOST!',
        priority: 'must',
        examSource: '28th BCS, RU, CU'
      }
    ]
  },

  // 9. DEGREE OF COMPARISON
  {
    id: 'degree-mastery',
    number: 9,
    title: 'Degree of Comparison: "Of the two", Double Comparatives',
    bengaliTitle: 'তুলনার মাত্রা: দুজনের মধ্যে তুলনা ও দ্বৈত তুলনামূলক কাঠামো',
    category: 'core_speech',
    priority: 'must',
    overview: 'ডিগ্রি পরিবর্তন ও তুলনামূলক কাঠামো থেকে বিসিএস-এ প্রতি বছর প্রশ্ন থাকে। বিশেষ করে "The + Comparative ... of the two" এবং "The more ..., the more ..." নিয়ম দুটি অতি গুরুত্বপূর্ণ।',
    rules: [
      {
        id: 'deg-1',
        ruleTitle: '"Of the two" Rule: The + Comparative Degree',
        bengaliNote: 'দুইজনের বা দুটি বস্তুর মধ্যে একজনকে ভালো/মন্দ বাছাই করতে Comparative এর পূর্বে "the" বসে।',
        formula: 'Subject + Verb + THE + Comparative Degree + of the two (+ Noun)',
        explanation: 'সাধারণত Superlative এর পূর্বে the বসে, কিন্তু যখন বাক্যে স্পষ্টভাবে "of the two" উল্লেখ থাকে, তখন Comparative degree এর পূর্বেও অবশ্যই "the" বসবে।',
        exampleCorrect: 'Of the two sisters, Rina is the prettier. | He is the taller of the two boys.',
        exampleIncorrect: 'Of the two sisters, Rina is prettiest. | He is taller of the two boys.',
        examTrap: 'পরীক্ষায় ৩ জনের বেশি থাকলে Superlative হবে (e.g. Of the three boys, he is the tallest), কিন্তু ২ জন থাকলে Comparative + the (the taller of the two)।',
        quickMemory: 'Two = The + Comparative; Three or more = The + Superlative!',
        priority: 'must',
        examSource: '17th, 34th, 37th BCS'
      },
      {
        id: 'deg-2',
        ruleTitle: 'Double Comparative Formula: Parallel Increase / Decrease',
        bengaliNote: 'যত ... তত প্রকাশ করতে উভয় অংশে "The + Comparative" বসে।',
        formula: 'The + Comparative + Sub + Verb, The + Comparative + Sub + Verb',
        explanation: 'যখন একটির বৃদ্ধির বা হ্রাসের সাথে অন্যটির পরিবর্তন ঘটে (আনুপাতিক বৃদ্ধি/হ্রাস), তখন উভয় ক্লজেই The + Comparative বসে। একে Proportional Comparison বলে।',
        exampleCorrect: 'The more you read, the more you learn. | The higher we go, the cooler it becomes. | The sooner, the better.',
        exampleIncorrect: 'More you read, more you learn. | The more you read, you learn more.',
        examTrap: 'উভয় দিকেই "The" থাকতে হবে এবং উভয় দিকেই Comparative থাকতে হবে।',
        quickMemory: 'The + Comp ... , The + Comp ... (The more ..., the more ...)',
        priority: 'must',
        examSource: '24th BCS, DU, JNU'
      },
      {
        id: 'deg-3',
        ruleTitle: 'Fewer vs Less / Many vs Much',
        bengaliNote: 'Countable Noun এর জন্য Fewer/Many, Uncountable Noun এর জন্য Less/Much বসে।',
        formula: 'Fewer + Plural Countable Noun | Less + Singular Uncountable Noun',
        explanation: 'People, students, books, accidents গণনা করা যায়, তাই এদের সাথে fewer বসবে। Water, money, time, traffic গণনা করা যায় না, তাই less বসবে।',
        exampleCorrect: 'There are fewer cars on the road today. | We have less time than we thought.',
        exampleIncorrect: 'There are less people in the room. (Incorrect: people is countable, must use fewer).',
        examTrap: 'পরীক্ষায় আসে: "There were ___ guests than expected." অপশন: fewer / less. সঠিক উত্তর: fewer (guests countable)।',
        quickMemory: 'Countable = FEWER; Uncountable = LESS!',
        priority: 'must',
        examSource: '35th BCS, 38th BCS, Bank PO'
      }
    ]
  },

  // 10. ARTICLES: THE COMPLETE HIGH-YIELD CHEAT SHEET
  {
    id: 'articles-mastery',
    number: 10,
    title: 'Articles: Sound Rules, Definite Article "The" & Zero Article',
    bengaliTitle: 'পদাশ্রিত নির্দেশক: ধ্বনিগত নিয়ম, The এর বিশেষ ক্ষেত্র ও অনুক্ত অনুচ্ছেদ',
    category: 'core_speech',
    priority: 'must',
    overview: 'Article ব্যবহারের মূল ভিত্তি বানানের অক্ষর নয়, বরং উচ্চারণ বা Sound। এছাড়া নির্দিষ্ট কিছু ভৌগোলিক নাম, সংবাদপত্র, ধর্মগ্রন্থ ও রোগের নামের আগে Article এর ব্যতিক্রমী নিয়ম পরীক্ষায় বারবার আসে।',
    rules: [
      {
        id: 'art-1',
        ruleTitle: 'Sound-Based Article Choice (A vs An)',
        bengaliNote: 'Vowel Sound (অ, আ, এ, ও) হলে An; Consonant Sound বা ইউ/ওয়া (u/wa) ধ্বনি হলে A বসে।',
        formula: 'Vowel letter pronounced as "Yu" / "Wa" -> A | Silent "H" / Consonant with vowel sound -> An',
        explanation: 'A university (ইউ), a European (ইউ), a union (ইউ), a one-eyed man (ওয়া), a useful book. An honest man (silent h), an hour, an heir (এয়ার), an honor, an MP (এম = এ+ম), an LLB (এল = এ+ল), an MBBS, an SDO.',
        exampleCorrect: 'He is an MA in English, but his brother is a BA. | He is a European gentleman. | I saw a one-eyed beggar.',
        exampleIncorrect: 'He is a MA. | He is an European.',
        examTrap: 'Abbreviation এর প্রথম অক্ষরের উচ্চারণ যদি স্বরবর্ণ দিয়ে শুরু হয় (M, N, L, S, F, H, R, X), তবে তার পূর্বে An বসবে।',
        quickMemory: 'উচ্চারণে "ইউ" বা "ওয়া" আসলে A; "অ/আ/এ/ই" আসলে AN!',
        priority: 'must',
        examSource: '12th, 24th, 37th BCS'
      },
      {
        id: 'art-2',
        ruleTitle: 'Geographical Names: When to use "The" vs Zero Article',
        bengaliNote: 'পর্বতমালা, দ্বীপপুঞ্জ, নদীর নামের আগে The বসে; কিন্তু একটিমাত্র পর্বত বা দ্বীপের আগে কোনো Article বসে না!',
        formula: 'Mountain RANGES / Groups of Islands = THE | Single Mountain / Single Island = ZERO ARTICLE',
        explanation: 'The Himalayas, The Alps (পর্বতমালা) -> THE. কিন্তু Mount Everest, Mount Kilimanjaro (একটিমাত্র পর্বতশৃঙ্গ) -> Zero Article. The Andamans, The West Indies (দ্বীপপুঞ্জ) -> THE. কিন্তু Sandwip, Sri Lanka, Java (একক দ্বীপ) -> Zero Article. The Ganges, The Padma (নদী), The Indian Ocean (মহাসাগর) -> THE. Lake Superior, Lake Baikal (হ্রদ) -> Zero Article.',
        exampleCorrect: 'Mount Everest is the highest peak in the Himalayas. | Sandwip is a big island.',
        exampleIncorrect: 'The Mount Everest is the highest mountain. | The Lake Chilka is in Orissa.',
        examTrap: '"___ Mount Everest is the highest peak in ___ Himalayas." ১ম শূন্যস্থানে No article, ২য় শূন্যস্থানে the!',
        quickMemory: 'Range/Group/River/Sea = THE; Single Peak/Single Island/Single Lake = NO ARTICLE!',
        priority: 'must',
        examSource: '15th, 23rd, 38th BCS'
      },
      {
        id: 'art-3',
        ruleTitle: 'Zero Article with Common Institutions (Primary Purpose vs Visiting)',
        bengaliNote: 'স্কুল, কলেজ, মসজিদ, হাসপাতাল, জেলখানায় যে উদ্দেশ্যে তৈরি সে উদ্দেশ্যে গেলে Article বসে না।',
        formula: 'Primary Purpose = NO ARTICLE | Secondary Purpose / Visiting = THE',
        explanation: 'He went to hospital as a patient. (রোগী হিসেবে চিকিৎসা নিতে গেলে No article). He went to the hospital to meet his sick friend. (দেখতে গেলে The). He goes to school at 9 am. (ছাত্র হিসেবে গেলে No article). His father went to the school to meet the headmaster. (The).',
        exampleCorrect: 'The criminal was sent to prison. (As a prisoner, no article). | She went to church to pray.',
        exampleIncorrect: 'The sick man was rushed to the hospital. (Patient = to hospital).',
        examTrap: 'পরীক্ষায় আসে: "Rahim went to ___ hospital as a patient." সঠিক উত্তর: No article (d)।',
        quickMemory: 'উদ্দেশ্যে গেলে NO ARTICLE; দর্শনার্থী বা পরিদর্শনে গেলে THE!',
        priority: 'must',
        examSource: '10th, 39th BCS, DU'
      }
    ]
  },

  // 11. ADVERB: TYPES & MPTR POSITIONING
  {
    id: 'adverbs-mastery',
    number: 11,
    title: 'Adverbs: Classification & MPTR Word Order',
    bengaliTitle: 'ক্রিয়া-বিশেষণ: প্রকারভেদ ও বাক্যে ক্রম (MPTR)',
    category: 'core_speech',
    priority: 'must',
    overview: 'Adverb বাক্যে Verb, Adjective বা অন্য Adverb কে কীভাবে, কখন, কোথায় ও কতবার সংঘটিত হচ্ছে তা বোঝায়। বাক্যে Adverb এর অবস্থান (Word order) ভুল সংশোধন প্রশ্নের অন্যতম প্রিয় ক্ষেত্র।',
    rules: [
      {
        id: 'adv-1',
        ruleTitle: 'The MPTR Rule: Order of Adverbs in a Sentence',
        bengaliNote: 'একই বাক্যে একাধিক Adverb থাকলে Manner -> Place -> Time -> Reason ক্রমানুসারে বসে।',
        formula: 'Subject + Verb + Manner (How?) + Place (Where?) + Time (When?) + Reason (Why?)',
        explanation: 'M = Manner (slowly, gracefully, bravely); P = Place (here, in the room, at the station); T = Time (yesterday, now, at 5 PM); R = Reason (to catch the train, for pleasure).',
        exampleCorrect: 'He spoke politely (M) in the meeting (P) yesterday (T). | She sang sweetly in the hall last night.',
        exampleIncorrect: 'He spoke yesterday politely in the meeting. | She sang last night sweetly in the hall.',
        examTrap: 'তবে যদি Verb of Movement (go, come, arrive) থাকে, তবে ক্রমটি হবে PMT (Place -> Manner -> Time): He went to London (P) by plane (M) last week (T)।',
        quickMemory: 'Standard verbs = M-P-T-R; Motion verbs = P-M-T!',
        priority: 'must',
        examSource: 'RU, CU, 37th BCS'
      },
      {
        id: 'adv-2',
        ruleTitle: 'Position of Adverbs of Frequency',
        bengaliNote: 'Always, never, often, seldom, rarely ইত্যাদি Main Verb এর পূর্বে কিন্তু Be/Auxiliary Verb এর পরে বসে।',
        formula: 'Subject + Frequency Adverb + Main Verb | Subject + Aux/Be Verb + Frequency Adverb',
        explanation: 'Always, often, rarely, seldom, usually, hardly, never ইত্যাদি Adverb of Frequency: Main verb এর আগে বসে (He always speaks the truth). কিন্তু Be verb (am/is/are/was/were) বা Modal verb থাকলে তার পরে বসে (He is always late; You must never lie).',
        exampleCorrect: 'He seldom visits us. | She has never seen a tiger. | We are always ready.',
        exampleIncorrect: 'He visits us seldom. | She never has seen a tiger.',
        examTrap: 'Used to এবং Have to এর ক্ষেত্রে Frequency Adverb এদের পূর্বে বসে: "I often used to smoke" বা "We always have to wear a uniform"।',
        quickMemory: 'Before Main Verb, After Be/Auxiliary Verb!',
        priority: 'must',
        examSource: '35th BCS, DU B-Unit'
      },
      {
        id: 'adv-3',
        ruleTitle: 'Inversion After Initial Negative/Restrictive Adverbs',
        bengaliNote: 'বাক্যের শুরুতে Negative Adverb আসলে Auxiliary Verb টি Subject এর পূর্বে চলে আসে (Inversion)।',
        formula: 'Negative Adverb + Auxiliary Verb + Subject + Main Verb',
        explanation: 'Hardly, Scarcely, Seldom, Barely, Rarely, Never, Little, Nowhere, Not only, At no time, Under no circumstances বাক্যের শুরুতে আসলে সাধারণ বাক্য কাঠামোর বদলে প্রশ্নবোধকের মতো Auxiliary verb সামনে চলে আসে।',
        exampleCorrect: 'Seldom have I seen such beauty. | Never again will they stay in that hotel. | Hardly did he know the truth.',
        exampleIncorrect: 'Seldom I have seen such beauty. | Never again they will stay.',
        examTrap: 'Inversion এ tense অনুযায়ী do/does/did অথবা be/have verb কে subject এর পূর্বে আনতে হবে।',
        quickMemory: 'Negative word at start = AUXILIARY BEFORE SUBJECT!',
        priority: 'must',
        examSource: '28th, 36th BCS, Bank PO'
      }
    ]
  },

  // 12. CONJUNCTIONS & LINKERS
  {
    id: 'conjunctions-mastery',
    number: 12,
    title: 'Conjunctions & Correlatives: Lest, Though, No Sooner',
    bengaliTitle: 'সংযোজক অব্যয় ও সহসংযোজক: লেস্ট, দো/অলদো, নো সুনার নিয়মাবলী',
    category: 'core_speech',
    priority: 'must',
    overview: 'Conjunction বাক্য বা ক্লজকে সংযুক্ত করে। পরীক্ষায় Correlative Conjunctions এর সঠিক জোড়া এবং কিছু বিশেষ শব্দ (Lest, Although, No sooner) এর ওপর প্রশ্ন নিশ্চিত থাকে।',
    rules: [
      {
        id: 'conj-1',
        ruleTitle: '"Lest" Clause Must Take "SHOULD", NEVER "NOT"',
        bengaliNote: '"Lest" মানে পাছে কিছু ঘটে এই ভয়ে; এর পরের ক্লজে should বসে এবং কোনো negative শব্দ বসে না।',
        formula: 'Main Clause + LEST + Subject + SHOULD / MIGHT + Base Verb (V1)',
        explanation: 'Lest নিজেই একটি না-বোধক শব্দ (Negative)। তাই এর সাথে never, not, no ইত্যাদি বসানো চরম ভুল। এছাড়া Verb এর পূর্বে সর্বদা should (কখনো কখনো might) বসবে।',
        exampleCorrect: 'Walk fast lest you should miss the train. | He hid himself lest he should be seen.',
        exampleIncorrect: 'Walk fast lest you should not miss the train. | Walk fast lest you will miss the train.',
        examTrap: 'পরীক্ষায় অপশনে "lest you will miss" বা "lest you should not miss" দিয়ে ফাঁদ পাতা হয়। উত্তর শুধুই: "should + V1"।',
        quickMemory: 'LEST = SHOULD + V1 (NO NOT/NEVER)!',
        priority: 'must',
        examSource: '11th, 26th, 38th BCS'
      },
      {
        id: 'conj-2',
        ruleTitle: '"Though / Although" Cannot Be Paired With "BUT"',
        bengaliNote: 'Though বা Although দিয়ে বাক্য শুরু হলে মাঝখানে কমা (,) বসবে, কিন্তু কখনোই "but" বা "yet" বসবে না।',
        formula: 'Though / Although + Clause 1 , Clause 2 (NO "BUT")',
        explanation: 'Though/Although নিজেই বৈপরীত্য প্রকাশকারী Conjunction। তাই একই বাক্যে সমন্বয়কারী Conjunction "but" যোগ করলে তা Redundancy (দ্বৈত দোষ) হয়।',
        exampleCorrect: 'Though he is poor, he is honest. | Although she worked hard, she failed.',
        exampleIncorrect: 'Though he is poor, but he is honest.',
        examTrap: 'Error spotting এ "Although he is rich, but he is unhappy" বাক্য দেওয়া থাকে। "but" কেটে দিতে হবে।',
        quickMemory: 'Though আছে তো BUT নেই!',
        priority: 'must',
        examSource: '17th, 35th BCS, DU'
      },
      {
        id: 'conj-3',
        ruleTitle: 'No Sooner ... Than / Scarcely ... When / Hardly ... When',
        bengaliNote: 'যেতে না যেতেই, পৌঁছাতে না পৌঁছাতেই অর্থে এই ত্রয়ী জোড়া অপরিবর্তনীয়।',
        formula: 'No sooner had + S + V3 ... THAN + Past Indefinite | Scarcely / Hardly had + S + V3 ... WHEN / BEFORE + Past Indefinite',
        explanation: '১. No sooner এর সাথে সর্বদা THAN বসবে (THEN নয়)। ২. Hardly বা Scarcely এর সাথে WHEN বা BEFORE বসবে। ৩. প্রথম অংশে Past Perfect (had + V3) এবং দ্বিতীয় অংশে Past Indefinite (V2) হবে।',
        exampleCorrect: 'No sooner had I reached the station than the train left. | Scarcely had we started when it began to rain.',
        exampleIncorrect: 'No sooner had I reached the station then the train left. | Hardly had he arrived then it rained.',
        examTrap: 'পরীক্ষায় "than" এর বদলে "then" বা "when" দিয়ে বিভ্রান্ত করা হয়। No sooner = THAN!',
        quickMemory: 'No sooner -> THAN; Hardly/Scarcely -> WHEN!',
        priority: 'must',
        examSource: '13th, 24th, 38th BCS'
      }
    ]
  },

  // 13. PREPOSITIONS & APPROPRIATE PREPOSITIONS (CORE REVISION)
  {
    id: 'prepositions-mastery',
    number: 13,
    title: 'Prepositions: High-Yield Appropriate Prepositions & Traps',
    bengaliTitle: 'পদান্বয়ী অব্যয়: পরীক্ষায় সর্বাধিক আসা অ্যাপ্রোপ্রিয়েট প্রেপোজিশন',
    category: 'core_speech',
    priority: 'must',
    overview: 'বিসিএস, ব্যাংক ও বিশ্ববিদ্যালয় ভর্তি পরীক্ষায় ২০-৩০% গ্রামার প্রশ্ন সরাসরি Preposition ও Appropriate Preposition থেকে আসে। নিচে সর্বাধিক জিজ্ঞাসিত ও বিভ্রান্তিকর জোড়াগুলো সংকলিত হলো।',
    rules: [
      {
        id: 'prep-1',
        ruleTitle: 'The "DIE" Preposition Matrix (Super High Yield)',
        bengaliNote: 'মৃত্যুর কারণের উপর ভিত্তি করে Die এর পর ভিন্ন ভিন্ন Preposition বসে।',
        formula: 'Die of = Disease/Hunger | Die from = Overeating/Injury | Die by = Poison/Suicide/Violence | Die for = Noble Cause/Country | Die in = War/Peace/Harness',
        explanation: '১. Die OF: রোগে বা ক্ষুধায় (die of cholera, malaria, cancer, fever, hunger). ২. Die FROM: ক্ষত, অতিরিক্ত খাওয়া, পরিশ্রম (die from overeating, wound, overwork). ৩. Die BY: বিষ, আত্মহত্যা, অস্ত্র বা সহিংসতায় (die by suicide, poison, violence). ৪. Die FOR: দেশের জন্য বা মহৎ উদ্দেশ্যে (die for his country). ৫. Die IN: যুদ্ধ, দারিদ্র্য বা কর্মে থাকাকালীন (die in battle, die in poverty, die in harness).',
        exampleCorrect: 'He died of cancer. | The soldier died from his wounds. | He died for his motherland. | The clerk died in harness (কর্মরত অবস্থায় মারা যান).',
        exampleIncorrect: 'He died by cholera. | He died of suicide.',
        examTrap: 'পরীক্ষায় আসে: "He died ___ overeating." অনেকেই of দাগায়, কিন্তু সঠিক উত্তর: "from"।',
        quickMemory: 'Disease = OF; Effect/Wound = FROM; Violence/Poison = BY; Country = FOR; Harness/Battle = IN',
        priority: 'must',
        examSource: '10th, 24th, 26th, 38th BCS'
      },
      {
        id: 'prep-2',
        ruleTitle: 'Blind TO vs Blind OF',
        bengaliNote: 'দোষের প্রতি অন্ধ হলে Blind to; চোখের দৃষ্টিহীনতায় Blind of/in বসে।',
        formula: 'Blind to (faults) | Blind of / in (one eye / both eyes)',
        explanation: 'কারো অপরাধ বা ত্রুটি দেখেও না দেখার ভান করা বা প্রশ্রয় দেওয়া হলো "blind to" (He is blind to his son’s fault). শারীরিক অন্ধত্ব প্রকাশে "blind of / in one eye" ব্যবহৃত হয়।',
        exampleCorrect: 'A mother is often blind to her son\'s faults. | The old man is blind of one eye.',
        exampleIncorrect: 'He is blind of his mistakes.',
        examTrap: 'পরীক্ষায় ভুল চিহ্নিত করতে দেয়: "He is blind in his flaws." সঠিক হবে "blind to"।',
        quickMemory: 'দোষ দেখলে "TO"; চোখ না দেখলে "OF/IN"!',
        priority: 'must',
        examSource: 'RU, JNU, Primary Teacher'
      },
      {
        id: 'prep-3',
        ruleTitle: 'Zero Preposition After Transitive Verbs (Common Trap)',
        bengaliNote: 'নিচের Verb গুলোর পর কোনো Preposition বসে না, সরাসরি Object বসে।',
        formula: 'Verb + NO PREPOSITION + Direct Object',
        explanation: 'Discuss, Describe, Order, Tell, Enter (প্রবেশ করা), Reach, Resemble (সদৃশ হওয়া), Marry, Resign, Await, Investigate, Violate, Comprise, Recommend, Emphasize. এদের পর about, into, to, with বসানো সম্পূর্ণ ভুল। [ব্যতিক্রম: Enter into an agreement = আলোচনা বা চুক্তি শুরু করা]।',
        exampleCorrect: 'Let us discuss the matter. (NOT discuss about) | He ordered a cup of tea. (NOT ordered for) | She entered the room. (NOT entered into)',
        exampleIncorrect: 'Let us discuss about the problem. | He reached at the station.',
        examTrap: '"He resembles to his father" ভুল; সঠিক: "He resembles his father"। "Order for a pizza" ভুল; সঠিক: "Order a pizza"।',
        quickMemory: 'Discuss, Describe, Order, Enter, Resemble, Reach -> NO PREPOSITION!',
        priority: 'must',
        examSource: '14th, 24th, 36th BCS'
      },
      {
        id: 'prep-4',
        ruleTitle: 'High-Yield Appropriate Preposition Cheat Sheet',
        bengaliNote: 'বিসিএস ও ব্যাংক নিয়োগে সর্বাধিক আসা ২০টি অপরিহার্য প্রেপোজিশন।',
        formula: 'Word + Fixed Preposition',
        explanation: 'Abide by (মেনে চলা), Accuse of (অভিযুক্ত করা), Accustomed to (অভ্যস্ত), Adjacent to (সংলগ্ন), Agree with (person) / to (proposal), Aim at (লক্ষ্য করা), Allude to (ইঙ্গিত করা), Angry with (person) / at (behavior), Anxious about (উদগ্রীব), Apologize to (person) for (action), Appeal to (authority) for (help), Applicable to (প্রযোজ্য), Apprised of (অবহিত), Aptitude for (সহজাত দক্ষতা), Ashamed of (লজ্জিত), Attend to (মনোযোগ দেওয়া), Authority on (বিষয়ে বিশেষজ্ঞ) / over (নিয়ন্ত্রণ), Averse to (বিমুখ), Aware of (সচেতন), Bark at (ঘেউ ঘেউ করা), Believe in (বিশ্বাস রাখা), Boast of (দম্ভ করা), Bound for (যাত্রাপথে), Call on (সাক্ষাৎ করা) / at (স্থান), Capable of (সক্ষম), Care for/about (যত্ন/পরোয়া), Close to (কাছে), Commit to (প্রতিশ্রুতিবদ্ধ), Compare to (ভিন্ন বস্তুর সাথে) / with (একই বস্তুর সাথে), Competent for (উপযুক্ত), Comply with (সম্মতি দেওয়া), Conducive to (উপকারী), Confide in (বিশ্বাস করা), Congratulate on (অভিনন্দন), Consist of (গঠিত) / in (নিহিত), Contempt of (অবমাননা), Control over (নিয়ন্ত্রণ), Cope with (মানিয়ে নেওয়া — NOT cope up with!), Cure of (রোগমুক্ত), Deal in (ব্যবসা) / with (আচরণ/সমাধান), Deficient in (অভাব), Depend on (নির্ভর), Deprived of (বঞ্চিত), Despair of (হতাশ), Devoid of (বর্জিত/শূন্য), Differ with (person) / from (thing), Dispense with (বাদ দেওয়া/রেহাই দেওয়া), Eligible for (যোগ্য), Enamored of/with (মুগ্ধ), End in (পরিণতি), Engaged to (বাগদত্তা) / in (কর্মে নিযুক্ত), Equal to (সমকক্ষ), Essential to/for (অপরিহার্য), Exempt from (অব্যাহতি), Familiar with (জ্ঞাত) / to (পরিচিত), Fond of (প্রিয়), Free from (মুক্ত), Good at (দক্ষ), Grateful to (person) for (favor), Guilty of (দোষী), Hanker after (লালায়িত), Harmful to (ক্ষতিকর), Hint at (ইঙ্গিত), Hope for (আশা), Hostile to (শত্রুভাবাপন্ন), Ignorant of (অজ্ঞ), Immune to (প্রতিরোধক্ষম), Impart to (প্রদান করা), Impose on (আরোপ করা), Indebted to (ঋণী), Indifferent to (উদাসীন), Indispensable to/for (অপরিহার্য), Inferior to (নিকৃষ্ট), Infested with (উপদ্রুত), Inform of (জানানো), Insist on (জেদ ধরা), Interested in (আগ্রহী), Introduce to (পরিচয়), Jealous of (ঈর্ষান্বিত), Junior to (কনিষ্ঠ), Key to (চাবিকাঠি), Lack of (অভাব), Laugh at (উপহাস), Limit to (সীমা), Listen to (শোনা), Live on (খেয়ে বাঁচা) / by (উপায়ে বাঁচা), Long for (আকাঙ্ক্ষা), Look after (যত্ন নেওয়া), Loyal to (বিশ্বস্ত), Married to (বিবাহিত), Mindful of (মনোযোগী), Mourn for/over (শোক প্রকাশ), Natural to (স্বাভাবিক), Negligent of/in (উদাসীন), Object to (আপত্তি), Obliged to (কৃতজ্ঞ), Obstacle to (বাধা), Offended with (person) / at (action), Partial to (পক্ষপাতী), Part with (thing) / from (person), Patience with (ধৈর্য), Peculiar to (অনন্য), Pity for (দয়া), Pleased with (সন্তুষ্ট), Polite to (ভদ্র), Popular with (জনপ্রিয়), Prefer to (পছন্দ), Prejudicial to (ক্ষতিকর), Prepare for (প্রস্তুত), Preside over (সভাপতিত্ব), Prevent from (বিরত রাখা), Pride in / Prides oneself on (গর্ব), Prior to (পূর্বে), Profit by/from (লাভ), Prohibit from (নিষেধ), Prone to (প্রবণ), Proud of (গর্বিত), Qualified for (যোগ্য), Quick at (চটপটে), Recover from (আরোগ্য), Refrain from (বিরত থাকা), Relevant to (প্রাসঙ্গিক), Rely on (ভরসা), Remind of (মনে করিয়ে দেওয়া), Repent of (অনুশোচনা), Resign to (ভাগ্য মেনে নেওয়া), Respect for (শ্রদ্ধা), Responsible to (person) for (action), Result in (পরিণতি) / from (কারণ), Rich in (সমৃদ্ধ), Rid of (রেহাই), Sacred to (পবিত্র), Satisfied with (সন্তুষ্ট), Senior to (জ্যেষ্ঠ), Short of (অভাব), Similar to (সদৃশ), Skillful in/at (দক্ষ), Slow at (ধীর), Stare at (তাকিয়ে থাকা), Subject to (অধীন), Succeed in (সফল), Suffer from (ভোগা), Superior to (শ্রেষ্ঠ), Sure of (নিশ্চিত), Surprised at (বিস্মিত), Susceptible to (সংবেদনশীল), Sympathize with (সহানুভূতি), Taste for (রুচি), Threaten with (হুমকি), Tired of (ক্লান্ত), Tolerant of (সহনশীল), True to (সত্যবাদী), Trust in (বিশ্বাস), Useful to/for (দরকারী), Vain of (অহংকারী), Versed in (পণ্ডিত), Vest in/with (অর্পণ করা), Void of (শূন্য), Wait for (অপেক্ষা) / on (সেবা করা), Warn of/against (সতর্ক করা), Wish for (কামনা), Worthy of (যোগ্য), Yield to (নতি স্বীকার)।',
        exampleCorrect: 'He is addicted to gambling. | One should refrain from smoking. | The pond is infested with weeds.',
        examTrap: 'Cope with (NOT cope up with). Prefer reading to writing (NOT than writing). Married to (NOT married with).',
        quickMemory: 'Part FROM a person, but part WITH a thing; Die OF disease, but suffer FROM disease!',
        priority: 'must',
        examSource: '33rd-45th BCS, All Universities'
      }
    ]
  },

  // 14. GROUP VERBS / PHRASAL VERBS (EXAM FAVOURITES)
  {
    id: 'group-verbs-mastery',
    number: 14,
    title: 'Group Verbs / Phrasal Verbs: High-Yield Selection',
    bengaliTitle: 'গ্রুপ ভার্ব / ফ্রেজাল ভার্ব: সর্বাধিক জিজ্ঞাসিত তালিকা',
    category: 'verbs_tenses',
    priority: 'must',
    overview: 'Group Verbs এর অর্থ মূল Verb এর আক্ষরিক অর্থ থেকে সম্পূর্ণ ভিন্ন হয়। নিচে বিসিএস ও ভর্তি পরীক্ষায় সবচেয়ে বেশি আসা গ্রুপ ভার্বগুলো সুসংহত করা হলো।',
    rules: [
      {
        id: 'gv-1',
        ruleTitle: 'Act, Bear, Blow, Break, Bring',
        bengaliNote: 'পরীক্ষায় বারবার আসা প্রধান Phrasal Verbs: ১ম খণ্ড।',
        formula: 'Verb + Particle = Idiomatic Meaning',
        explanation: 'Act on/upon: ক্ষতি করা বা অনুসারে চলা (Smoking acts upon health). Bear out: সমর্থন/প্রমাণ করা (His testimony bears out the truth). Blow out: নেভানো (Blow out the candle). Blow up: বিস্ফোরণে উড়িয়ে দেওয়া (The bridge was blown up). Break down: বিকল হওয়া বা স্বাস্থ্যের অবনতি (His car broke down). Break out: প্রাদুর্ভাব ঘটা (Cholera broke out in the village). Break into: জোরপূর্বক প্রবেশ (The thief broke into the house). Bring about: ঘটানো (Hard work brought about his success). Bring up: লালন-পালন করা (He was brought up by his aunt). Bring out: প্রকাশ করা (The publisher brought out a new book).',
        exampleCorrect: 'Instead of "confirm" we say: bear out. | Instead of "extinguish" we say: blow out / put out.',
        examTrap: '"Break down" মানে কান্নায় ভেঙে পড়াও হয়, আবার শারীরিক/যান্ত্রিক বিপর্যয়ও বোঝায়।',
        quickMemory: 'Bear out = Confirm; Bring about = Cause to happen; Bring up = Rear; Blow out = Extinguish',
        priority: 'must',
        examSource: '26th, 38th BCS, RU'
      },
      {
        id: 'gv-2',
        ruleTitle: 'Call, Come, Cut, Die, Fall, Get',
        bengaliNote: 'পরীক্ষায় বারবার আসা প্রধান Phrasal Verbs: ২য় খণ্ড।',
        formula: 'Verb + Particle = Meaning',
        explanation: 'Call off: প্রত্যাহার/বাতিল করা (The strike was called off). Call on: কারো সাথে দেখা করা (He called on me). Call in: ডেকে আনা (Please call in a doctor). Come across: হঠাৎ দেখা পাওয়া (I came across an old friend). Come by: পাওয়া (How did you come by this watch?). Come round: আরোগ্য লাভ (The patient will come round soon). Cut down: কমানো (Cut down your expenses). Fall out: ঝগড়া করা (The brothers fell out). Fall through: ব্যর্থ হওয়া (All plans fell through). Get over: অতিক্রম করা (He got over the crisis). Get through: পরীক্ষায় উত্তীর্ণ হওয়া (She got through the exam).',
        exampleCorrect: 'The meeting was called off. (= cancelled) | The doctor was called in. (= summoned)',
        examTrap: 'Call for = দাবি করা/প্রয়োজন হওয়া; Call on = দেখা করা; Call at = কোনো স্থানে যাওয়া।',
        quickMemory: 'Call off = Cancel; Come across = Meet by chance; Come by = Obtain; Come round = Recover',
        priority: 'must',
        examSource: '29th, 33rd, 37th BCS'
      },
      {
        id: 'gv-3',
        ruleTitle: 'Look, Make, Put, Run, Set, Take, Turn',
        bengaliNote: 'পরীক্ষায় বারবার আসা প্রধান Phrasal Verbs: ৩য় খণ্ড।',
        formula: 'Verb + Particle = Meaning',
        explanation: 'Look after: দেখাশোনা করা. Look down upon: ঘৃণা করা. Look for: খোঁজা. Look into: তদন্ত করা. Look up: ডিকশনারিতে শব্দ খোঁজা (Look up the word in the dictionary). Make out: বুঝতে পারা (I cannot make out your handwriting). Make up for: ক্ষতিপূরণ করা (Make up for the loss). Put off: স্থগিত রাখা (Never put off till tomorrow what you can do today). Put out: নেভানো (Put out the fire). Put up with: সহ্য করা (I cannot put up with such insult = tolerate). Run into: ঋণে পড়া (Run into debt). Set up: স্থাপন করা (Set up a school). Set out: যাত্রা শুরু (Set out for Dhaka). Take after: সদৃশ হওয়া (She takes after her mother = resembles). Take to: আসক্ত হওয়া. Turn down: প্রত্যাখ্যান করা (He turned down my offer).',
        exampleCorrect: 'Look up the word in the dictionary. | She takes after her mother. | He put off the meeting.',
        examTrap: 'ডিকশনারিতে শব্দ খুঁজতে সর্বদা "Look up" হবে, "Look for" বা "Search" নয়!',
        quickMemory: 'Look up = Search in book; Put up with = Tolerate; Put off = Postpone; Put out = Extinguish; Take after = Resemble',
        priority: 'must',
        examSource: '13th, 24th, 33rd, 38th BCS'
      }
    ]
  },

  // 15. TENSES & SEQUENCE OF TENSE
  {
    id: 'tenses-mastery',
    number: 15,
    title: 'Tenses & Sequence of Tense: Before/After & Past Habits',
    bengaliTitle: 'কাল ও কালের ধারাবাহিকতা: Before/After সূত্র ও অতীতের নিয়ম',
    category: 'verbs_tenses',
    priority: 'must',
    overview: 'Tense পরীক্ষায় সরাসরি গঠন ছাড়াও দুটি কাজের সংযোগ (Past Perfect), সময় নির্দেশক শব্দ (Since/For) এবং Sequence of Tense এর ব্যতিক্রমী নিয়ম থেকে প্রশ্ন আসে।',
    rules: [
      {
        id: 'ten-1',
        ruleTitle: 'The "Before" & "After" Past Perfect Formula',
        bengaliNote: 'Before এর পূর্বে Past Perfect এবং After এর পরে Past Perfect বসে।',
        formula: 'Past Perfect + BEFORE + Past Indefinite | Past Indefinite + AFTER + Past Perfect',
        explanation: 'অতীতকালে সংঘটিত দুটি কাজের মধ্যে যেটি আগে হয়েছিল তা Past Perfect (had + V3) এবং যেটি পরে হয়েছিল তা Past Indefinite (V2)। Before মানে পূর্বে, তাই এর পূর্বে Past Perfect; After মানে পরে, তাই এর পরে Past Perfect।',
        exampleCorrect: 'The patient had died before the doctor came. | The doctor came after the patient had died.',
        exampleIncorrect: 'The patient died before the doctor had come. | The doctor had come after the patient died.',
        examTrap: 'পরীক্ষায় আসে: "The train had left before I ___ (reach) the station." উত্তর: reached।',
        quickMemory: 'Past Perfect + BEFORE; AFTER + Past Perfect!',
        priority: 'must',
        examSource: '12th, 15th, 22nd BCS, All Unis'
      },
      {
        id: 'ten-2',
        ruleTitle: 'Since Clause Tense Rules',
        bengaliNote: 'Since এর ১ম অংশ Present হলে পরের অংশ Past Indefinite; ১ম অংশ Past Indefinite হলে পরের অংশ Past Perfect।',
        formula: 'Present Indefinite/Perfect + SINCE + Past Indefinite | Past Indefinite + SINCE + Past Perfect',
        explanation: '১. It is ten years since I met you last. (is = Present -> met = Past Indefinite). ২. It was ten years since I had met you last. (was = Past Indefinite -> had met = Past Perfect).',
        exampleCorrect: 'Many years have passed since his father died. | It was long since we had seen each other.',
        exampleIncorrect: 'It is ten years since I had seen him. | Many years passed since his father died.',
        examTrap: 'Since এর আগে Present থাকলে পরে Past Indefinite; কিন্তু আগে Past থাকলে পরে Past Perfect!',
        quickMemory: 'Present + Since + V2 | V2 + Since + Had+V3',
        priority: 'must',
        examSource: '23rd, 38th BCS, DU, RU'
      },
      {
        id: 'ten-3',
        ruleTitle: 'Sequence of Tense Exception: Universal Truth & Scientific Fact',
        bengaliNote: 'Principal Clause অতীতে থাকলেও Subordinate Clause যদি চিরন্তন সত্য বা অভ্যাস হয় তবে তা Present Indefinite-ই থাকবে।',
        formula: 'Past Main Clause + that + Present Indefinite (Universal Truth)',
        explanation: 'সাধারণ নিয়ম অনুযায়ী Principal clause Past হলে Subordinate clause-ও Past হয় (He said that he was ill). কিন্তু চিরন্তন সত্য, বৈজ্ঞানিক সত্য বা ভৌগোলিক সত্য হলে Tense এর কোনো পরিবর্তন হয় না।',
        exampleCorrect: 'The teacher said that the earth moves round the sun. | Galileo proved that the earth is round.',
        exampleIncorrect: 'The teacher said that the earth moved round the sun.',
        examTrap: 'পরীক্ষায় Narration বা Sentence correction এ "the earth moved round the sun" থাকলে তা ভুল চিহ্নিত করতে হবে।',
        quickMemory: 'Universal Truth is ALWAYS PRESENT INDEFINITE!',
        priority: 'must',
        examSource: '18th, 24th, 36th BCS'
      }
    ]
  },

  // 16. RIGHT FORM OF VERBS (GOLDEN RULES)
  {
    id: 'right-form-verbs',
    number: 16,
    title: 'Right Form of Verbs: 10 Essential Exam Formulas',
    bengaliTitle: 'ক্রিয়ার সঠিক রূপ: ১০টি অপরিহার্য পরীক্ষার সূত্র',
    category: 'verbs_tenses',
    priority: 'must',
    overview: 'Right Form of Verbs এ সবচেয়ে বেশি আসা ১০টি সূত্র যা প্রায় প্রতিটি বিসিএস, প্রাইমারি শিক্ষক নিয়োগ ও বিশ্ববিদ্যালয় ভর্তি পরীক্ষায় আসে।',
    rules: [
      {
        id: 'rfv-1',
        ruleTitle: '"It is high time / It is time" + Past Indefinite (V2)',
        bengaliNote: 'উপযুক্ত সময় পার হয়ে গেছে বোঝাতে It is high time এর পর Subject থাকলে Verb এর Past form (V2) বসে।',
        formula: 'It is high time + Subject + V2 (Past Form) | It is high time + to + V1',
        explanation: 'It is high time / It is time এর পর যদি Subject থাকে, তবে Verb টি অবশ্যই Past Indefinite (V2) হবে। তবে যদি কোনো Subject না থাকে, তবে "to + V1" বসবে।',
        exampleCorrect: 'It is high time we changed our bad habits. | It is high time to do the work.',
        exampleIncorrect: 'It is high time we change our bad habits. | It is high time we should change our habits.',
        examTrap: 'কোনোভাবেই "should" বা "must" বসানো যাবে না। Subject থাকলে সরাসরি V2 (Past form)।',
        quickMemory: 'It is high time + Subject + V2 (Past Tense)!',
        priority: 'must',
        examSource: '24th, 35th, 37th, 38th BCS'
      },
      {
        id: 'rfv-2',
        ruleTitle: '"As if / As though / Wish / Fancy" -> WERE or Past Perfect',
        bengaliNote: 'অবাস্তব কল্পনা বা ভান বোঝাতে Be verb হিসেবে সর্বদা WERE বসে (Subject যাই হোক না কেন)।',
        formula: 'Present + AS IF / AS THOUGH + Past (were / V2) | Past + AS IF / AS THOUGH + Past Perfect (had + V3)',
        explanation: '১. He talks as if he were mad. (Present + as if + were). ২. He talked as if he had known everything. (Past + as if + had + V3). ৩. I wish I were a king. I fancy I turned pale.',
        exampleCorrect: 'He speaks as if he knew everything. | She acts as though she were a queen. | I wish I were a bird.',
        exampleIncorrect: 'He speaks as if he was mad. | I wish I was a king.',
        examTrap: 'Unreal past এ "was" কখনোই বসে না, সর্বদাই "were" বসবে।',
        quickMemory: 'As if / As though / Wish = ALWAYS "WERE" (NEVER WAS)!',
        priority: 'must',
        examSource: '17th, 20th, 38th BCS, DU'
      },
      {
        id: 'rfv-3',
        ruleTitle: '"While" Rules: While + V-ing vs While + Past Continuous',
        bengaliNote: 'While এর ঠিক পরেই Verb আসলে -ing; কিন্তু While এর পর Subject থাকলে Past Continuous হয়।',
        formula: 'While + Verb-ing | While + Subject + was/were + Verb-ing',
        explanation: 'While walking in the garden, a snake bit him. (While এর পর সরাসরি verb আসলে -ing). While he was walking in the garden, a snake bit him. (Subject আসলে Continuous Tense).',
        exampleCorrect: 'While walking in the street, I saw a dead dog. | While he was reading, the telephone rang.',
        exampleIncorrect: 'While walk in the street. | While he walking.',
        examTrap: 'Dangling modifier এড়ানোর জন্য While এর পর Subject সহ ক্লজ ব্যবহার করা সবচেয়ে নিরাপদ।',
        quickMemory: 'While + V-ing (No subject) | While + Sub + was/were + V-ing',
        priority: 'must',
        examSource: '26th, 38th BCS'
      },
      {
        id: 'rfv-4',
        ruleTitle: 'Verbs of Need / Want / Require with Passive Meaning',
        bengaliNote: 'Need, want, require এর Subject যদি বস্তুবাচক হয়, তবে এর পরে Gerund (V-ing) অথবা "to be + V3" বসে।',
        formula: 'Thing + NEED / REQUIRE / WANT + Verb-ing OR to be + V3',
        explanation: 'The house needs painting (= to be painted). The car needs repairing (= to be repaired). The grass wants cutting. কিন্তু ব্যক্তিবাচক Subject হলে সাধারণ "need to + V1" বসবে: I need to buy a car.',
        exampleCorrect: 'The car needs repairing. / The car needs to be repaired. | The grass needs cutting.',
        exampleIncorrect: 'The car needs to repair.',
        examTrap: 'পরীক্ষায় আসে: "The car needs ___." অপশন: a) repair b) repairing c) to repair d) repaired. উত্তর: repairing!',
        quickMemory: 'Inanimate Subject + Need/Require = V-ing or to be + V3!',
        priority: 'must',
        examSource: 'DU, RU, CU Admission'
      }
    ]
  },

  // 17. VOICE TRANSFORMATION & PASSIVE TRAPS
  {
    id: 'voice-mastery',
    number: 17,
    title: 'Voice: Prepositions other than "By" & Quasi-Passive Traps',
    bengaliTitle: 'বাচ্য রূপান্তর: "By" ব্যতীত অন্যান্য প্রেপোজিশন ও আধা-কর্মবাচ্য',
    category: 'syntax_rules',
    priority: 'must',
    overview: 'Passive Voice এ সবসময় "by" বসে না। কিছু বিশেষ Verb এ at, with, to, in বসে। এছাড়া Quasi-Passive (আধা-কর্মবাচ্য) এবং Imperative বাক্যের ভয়েস চেঞ্জ পরীক্ষায় প্রায়শই আসে।',
    rules: [
      {
        id: 'voi-1',
        ruleTitle: 'Verbs that take AT, WITH, TO, IN instead of "BY"',
        bengaliNote: 'Passive Voice এ যেসব Verb কখনোই "by" নেয় না।',
        formula: 'Subject + Be + V3 + (at / with / to / in) + Agent',
        explanation: '১. TO: Known to, Married to, Obliged to. (e.g. He is known to me). ২. AT: Surprised at, Shocked at, Astonished at, Alarmed at, Pleased at (behavior), Annoyed at (conduct). ৩. WITH: Pleased with (person), Satisfied with, Filled with, Covered with, Crowded with, Disgusted with. ৪. IN: Contained in, Embodied in, Interested in.',
        exampleCorrect: 'I know him -> He is known to me. | The smoke filled the room -> The room was filled with smoke. | Panic seized me -> I was seized with panic.',
        exampleIncorrect: 'He is known by me. | The room was filled by smoke.',
        examTrap: 'Pleased with a person (I am pleased with him) বনাম Pleased at conduct (I was pleased at his conduct)। Annoyed with a person বনাম Annoyed at conduct।',
        quickMemory: 'Known/Married = TO; Surprise/Shock = AT; Satisfy/Fill = WITH; Contain/Interest = IN',
        priority: 'must',
        examSource: '10th, 27th, 39th BCS'
      },
      {
        id: 'voi-2',
        ruleTitle: 'Quasi-Passive Verbs (Active in Form, Passive in Meaning)',
        bengaliNote: 'যেসব Verb বাহ্যিকভাবে Active কিন্তু অর্থে Passive, তাদের দুইভাবে Passive করা যায়।',
        formula: 'Sub + be + Adj + when it is + V3 OR Sub + be + being + V3',
        explanation: '১. Complement যুক্ত: Honey tastes sweet -> Honey is sweet when it is tasted. Rice sells cheap -> Rice is cheap when it is sold. The pill tastes bitter -> The pill is bitter when it is tasted. ২. Complement বিহীন: The house is building -> The house is being built. The book is printing -> The book is being printed.',
        exampleCorrect: 'Rice sells cheap -> Rice is cheap when it is sold. | The bed feels soft -> The bed is soft when it is felt.',
        exampleIncorrect: 'Rice is sold cheaply when it sells.',
        examTrap: '"The house is building" বাক্যটি সঠিক (Quasi-Passive), এর পরিবর্তিত রূপ হবে "The house is being built"।',
        quickMemory: 'Taste/Sell/Feel: [Sub + Be + Adj + when it is + V3]!',
        priority: 'must',
        examSource: '14th, 28th BCS, RU'
      },
      {
        id: 'voi-3',
        ruleTitle: 'Imperative Sentence Voice Rules (Order, Advice, Request)',
        bengaliNote: 'অনুজ্ঞাসূচক বাক্যে Let, Let not বা Should be দিয়ে Passive করতে হয়।',
        formula: 'Order: Let + Object + be + V3 | Negative: Let not + Object + be + V3 | Advice: Object + should be + V3',
        explanation: '১. Do the work -> Let the work be done. ২. Do not hate the poor -> Let not the poor be hated. ৩. Never tell a lie -> Let not a lie ever be told / Let a lie never be told. ৪. Obey your parents (উপদেশ) -> Your parents should be obeyed. ৫. Shut the door -> Let the door be shut.',
        exampleCorrect: 'Close the door -> Let the door be closed. | Help the distressed -> The distressed should be helped.',
        exampleIncorrect: 'The door must be closed by you. (Inappropriate transformation for simple order)',
        examTrap: '"Let him do it" এর passive হবে: "Let it be done by him" (him পরিবর্তিত হয়ে শেষে বসবে)।',
        quickMemory: 'Order = Let + obj + be + V3; Moral Advice = Obj + should be + V3!',
        priority: 'must',
        examSource: '12th, 35th BCS, Primary'
      }
    ]
  },

  // 18. NARRATION / DIRECT & INDIRECT SPEECH
  {
    id: 'narration-mastery',
    number: 18,
    title: 'Narration: Backshifting, WH-Questions & Modals',
    bengaliTitle: 'উক্তি পরিবর্তন: কালান্তর, প্রশ্নবোধক ও মোডালের নিয়ম',
    category: 'syntax_rules',
    priority: 'must',
    overview: 'Direct থেকে Indirect Speech এ পরিবর্তনের সময় Reporting Verb অতীতে থাকলে Tense ও Pronoun এর ব্যাকশিফটিং ঘটে। Interrogative ও Imperative বাক্যের রিপোর্টিং থেকে সবচেয়ে বেশি প্রশ্ন আসে।',
    rules: [
      {
        id: 'nar-1',
        ruleTitle: 'Tense Backshifting & Time/Place Expression Matrix',
        bengaliNote: 'Reporting Verb অতীতে থাকলে ভেতরের Tense এক ধাপ অতীতে সরে যায়।',
        formula: 'Present Indefinite -> Past Indefinite | Present Continuous -> Past Continuous | Present Perfect / Past Indefinite -> Past Perfect',
        explanation: 'Can -> Could, May -> Might, Will/Shall -> Would, Must -> Had to (বা অপরিবর্তিত যদি চিরন্তন বাধ্যবাধকতা হয়)। শব্দ পরিবর্তন: Now -> Then, Today -> That day, Tomorrow -> The next day / the following day, Yesterday -> The previous day / the day before, Ago -> Before, Here -> There, This -> That, These -> Those.',
        exampleCorrect: 'He said, "I saw her yesterday." -> He said that he had seen her the day before.',
        exampleIncorrect: 'He said that he saw her yesterday. | He said that he had saw her.',
        examTrap: 'Past Indefinite থাকলে Indirect এ Past Perfect (had + V3) হবে: "I finished the work" -> "he had finished the work"।',
        quickMemory: 'V1 -> V2; V2 -> Had+V3; Have/Has -> Had; Will/Can/May -> Would/Could/Might',
        priority: 'must',
        examSource: '15th, 26th, 38th BCS'
      },
      {
        id: 'nar-2',
        ruleTitle: 'Reporting Questions: IF/WHETHER vs Retained WH-Word',
        bengaliNote: 'প্রশ্নবোধক বাক্য Indirect করার সময় বাক্যটি Assertive (Subject + Verb) হয়ে যায়।',
        formula: 'Yes/No: Asked + IF / WHETHER + Subject + Verb | WH: Asked + WH-word + Subject + Verb',
        explanation: 'Indirect প্রশ্নে কখনো Auxiliary verb আগে বসে না; সর্বদা Subject আগে বসে। আর কোনো Question Mark (?) থাকে না, Full stop (.) বসে। Yes/No প্রশ্নে If/Whether বসে (that বসে না)।',
        exampleCorrect: 'He said to me, "Where do you live?" -> He asked me where I lived. | She said, "Are you coming?" -> She asked if I was coming.',
        exampleIncorrect: 'He asked me where did I live. | She asked that if I was coming.',
        examTrap: '"He asked me where was I going" ভুল! সঠিক হবে "He asked me where I was going"।',
        quickMemory: 'Indirect questions are ALWAYS statements: WH-word + Subject + Verb (NO ?)!',
        priority: 'must',
        examSource: '27th, 38th BCS, DU'
      },
      {
        id: 'nar-3',
        ruleTitle: 'Imperative, Optative & Exclamatory Sentences',
        bengaliNote: 'আদেশ/অনুরোধে To + V1; প্রার্থনায় Prayed/Wished that; বিস্ময়ে Exclaimed with joy/sorrow বসে।',
        formula: 'Imperative: ordered/advised/told + to + V1 | Optative: prayed/wished that + S + might + V1 | Exclamatory: exclaimed with joy/sorrow that',
        explanation: '১. The doctor said to me, "Do not smoke." -> The doctor advised me not to smoke. (বা forbade me to smoke). ২. Mother said, "May you be happy." -> Mother prayed that I might be happy. ৩. He said, "Alas! I am undone." -> He exclaimed with sorrow that he was undone.',
        exampleCorrect: 'He said to me, "Please sit down." -> He requested me to sit down. | "Let us go" -> He proposed that we should go.',
        exampleIncorrect: 'He forbade me not to smoke. (Forbade নিজেই negative, not বসবে না!)',
        examTrap: '"Let us" থাকলে Propose / Suggest + that + we/they should বসে। কিন্তু "Let me" থাকলে requested + that + he might বসে।',
        quickMemory: 'Negative command = "not to + V1" OR "forbade to + V1" (NO NOT with forbade)!',
        priority: 'must',
        examSource: '10th, 24th, 33rd BCS'
      }
    ]
  },

  // 19. SUBJECT-VERB AGREEMENT (THE CRITICAL SECTION)
  {
    id: 'sva-mastery',
    number: 19,
    title: 'Subject-Verb Agreement: 12 High-Frequency Core Rules',
    bengaliTitle: 'কর্তা-ক্রিয়া অন্বয়: পরীক্ষায় সর্বাধিক আসা ১২টি নিয়ম',
    category: 'syntax_rules',
    priority: 'must',
    overview: 'যেকোনো প্রতিযোগিতামূলক পরীক্ষার ইংরেজি অংশে Subject-Verb Agreement থেকে সবচেয়ে বেশি প্রশ্ন আসে। Subject এর বিভ্রান্তিকর রূপ ও দূরবর্তী অবস্থানের কারণে ভুল ঘটে।',
    rules: [
      {
        id: 'sva-1',
        ruleTitle: 'As well as / Along with / Together with / With / In addition to',
        bengaliNote: 'এই সংযোজকগুলো দিয়ে যুক্ত হলে Verb সর্বদা প্রথম Subject অনুযায়ী নির্ধারিত হয়।',
        formula: 'Subject 1 + as well as / along with / together with / accompanied by / with / in addition to / including / except + Subject 2 + Verb (Agrees with Sub 1)',
        explanation: 'দ্বিতীয় Subject টি Plural হলেও কোনো প্রভাব ফেলবে না; প্রথম Subject টি Singular হলে Verb Singular, Plural হলে Verb Plural হবে।',
        exampleCorrect: 'The chairman, along with his assistants, is coming. | They, as well as he, are guilty. | Rahim and not you has won the prize.',
        exampleIncorrect: 'The chairman, along with his assistants, are coming.',
        examTrap: 'পরীক্ষায় comma বা ফ্রেজ দিয়ে চোখ ফাঁকি দেওয়া হয়: "The girl, along with her friends, (is/are) coming." উত্তর: "is"।',
        quickMemory: 'As well as / Along with / With -> Verb follows the FIRST Subject!',
        priority: 'must',
        examSource: '18th, 24th, 38th BCS, All Unis'
      },
      {
        id: 'sva-2',
        ruleTitle: 'Either ... Or / Neither ... Nor / Not only ... But also',
        bengaliNote: 'এই কো-রিলেটিভ কনজাংশনগুলো দিয়ে যুক্ত হলে Verb সর্বদা নিকটবর্তী (২য়) Subject অনুযায়ী বসে।',
        formula: 'Either S1 or S2 / Neither S1 nor S2 + Verb (Agrees with NEAREST Subject, S2)',
        explanation: 'যদি একটি Subject singular এবং অপরটি plural হয়, তবে নিয়ম অনুযায়ী plural subject টিকে verb এর কাছাকাছি বসানো সমীচীন এবং Verb ও plural হয়।',
        exampleCorrect: 'Neither the manager nor his employees were present. | Either they or I am wrong. | Neither she nor her sisters are responsible.',
        exampleIncorrect: 'Neither the manager nor his employees was present. | Either he or you is responsible.',
        examTrap: 'পরীক্ষায় আসে: "Neither Karim nor his friends (has/have) done this." উত্তর: have (friends এর কারণে)।',
        quickMemory: 'Either...or / Neither...nor -> Verb agrees with the NEAREST Subject!',
        priority: 'must',
        examSource: '29th, 38th BCS, Bank PO'
      },
      {
        id: 'sva-3',
        ruleTitle: 'Each / Every / Either / Neither Alone (Always Singular)',
        bengaliNote: 'Each, every, either, neither, one of, each of, everyone এর পর সর্বদা Singular Verb বসে।',
        formula: 'Each / Every / One of + Plural Noun + SINGULAR VERB',
        explanation: '"One of the + Plural Noun + Singular Verb": One of my friends is a doctor. Each of the boys has submitted his task. Neither of the two sisters was present.',
        exampleCorrect: 'One of the boys was punished. | Each of the students has a book. | Neither of the options is correct.',
        exampleIncorrect: 'One of my friends are doctors. | Each of the boys have a pen.',
        examTrap: 'ব্যতিক্রম: "One of the + Plural Noun + WHO/THAT + Plural Verb": He is one of the boys who work hard (কারণ who এর antecedent boys)। কিন্তু "The ONLY one of the + Plural noun + who + Singular verb"!',
        quickMemory: 'One of the + Plural Noun + SINGULAR Verb; BUT One of the + Plural Noun + WHO + PLURAL Verb!',
        priority: 'must',
        examSource: '16th, 23rd, 38th BCS'
      },
      {
        id: 'sva-4',
        ruleTitle: '"A Number of" (Plural Verb) vs "The Number of" (Singular Verb)',
        bengaliNote: '"A number of" এর পর Plural Verb; কিন্তু "The number of" এর পর Singular Verb বসে।',
        formula: 'A number of + Plural Noun + PLURAL VERB | The number of + Plural Noun + SINGULAR VERB',
        explanation: '"A number of" মানে "অনেকগুলো / একদল" (Many) তাই Plural। "The number of" মানে "নির্দিষ্ট সংখ্যাটি" (The specific count) তাই Singular।',
        exampleCorrect: 'A number of students were present. | The number of applicants is increasing daily.',
        exampleIncorrect: 'A number of students was present. | The number of applicants are increasing.',
        examTrap: 'A = Plural; The = Singular! এটি একটি অত্যন্ত প্রচলিত প্রশ্ন।',
        quickMemory: 'A number = PLURAL Verb; The number = SINGULAR Verb!',
        priority: 'must',
        examSource: '23rd, 38th, 40th BCS'
      },
      {
        id: 'sva-5',
        ruleTitle: 'Time, Distance, Weight, Money as a Single Unit (Singular Verb)',
        bengaliNote: 'দূরত্ব, সময়, ওজন বা টাকার পরিমাণ সমষ্টিগত একক হিসেবে বোঝালে Verb Singular হয়।',
        formula: 'Plural measurement of Time/Distance/Money + SINGULAR VERB',
        explanation: 'Ten miles is a long distance. Fifty thousand dollars is a huge sum. Two hours is enough time to finish this test.',
        exampleCorrect: 'Twenty miles was a long way to walk. | Sixty minutes is an hour. | Five hundred dollars was spent.',
        exampleIncorrect: 'Twenty miles were a long way. | Ten dollars are enough.',
        examTrap: 'যদি অর্থ বা সময় পৃথকভাবে ব্যয়িত হওয়া বোঝায়, তবে Plural হতে পারে: "Ten thousand dollars were scattered on the floor" (টাকাগুলো মেঝের ওপর ছড়িয়ে ছিল)।',
        quickMemory: 'Distance / Money / Time as ONE UNIT = SINGULAR VERB!',
        priority: 'must',
        examSource: '20th, 24th, 36th BCS'
      },
      {
        id: 'sva-6',
        ruleTitle: 'Fractions & Percentages (Verb Follows the Noun in "Of")',
        bengaliNote: 'ভগ্নাংশ ও শতকরা হারে "of" এর পরের Noun অনুযায়ী Verb নির্ধারিত হয়।',
        formula: 'Fraction / % + of + Singular/Uncountable Noun -> SINGULAR Verb | Fraction / % + of + Plural Noun -> PLURAL Verb',
        explanation: 'Two-thirds of the work has been finished (work uncountable -> has). Two-thirds of the students are absent (students plural -> are). Fifty percent of the land is cultivated vs Fifty percent of the people are poor.',
        exampleCorrect: 'Two-thirds of the money was spent. | Three-fourths of the boys have passed.',
        exampleIncorrect: 'Two-thirds of the work have been finished.',
        examTrap: 'Two-third নয়, সঠিক বানান Two-thirds (লব ১ এর বেশি হলে হরের সাথে s যুক্ত হয়: Two-thirds, Three-fourths)।',
        quickMemory: 'Fraction of Singular = Singular Verb; Fraction of Plural = Plural Verb!',
        priority: 'must',
        examSource: '23rd, 35th BCS, RU'
      }
    ]
  },

  // 20. CONDITIONAL SENTENCES & INVERSION
  {
    id: 'conditionals-mastery',
    number: 20,
    title: 'Conditionals: Zero, 1st, 2nd, 3rd & Inverted Structures',
    bengaliTitle: 'শর্তসূচক বাক্য: চারটি প্রকার ও ইনভার্সন কৌশল',
    category: 'syntax_rules',
    priority: 'must',
    overview: 'শর্তসূচক বাক্য ও তার ইনভার্সন রূপ বিসিএস ও বিশ্ববিদ্যালয় ভর্তি পরীক্ষায় শতভাগ নিয়মিত।',
    rules: [
      {
        id: 'cond-1',
        ruleTitle: 'The 4 Conditional Types Formula Matrix',
        bengaliNote: 'শর্তযুক্ত বাক্যের ৪টি মানসম্মত কালগত মেলবন্ধন।',
        formula: 'Zero: If+Present, Present | 1st: If+Present, Future (will/can+V1) | 2nd: If+Past (V2/were), would/could+V1 | 3rd: If+Had+V3, would/could+have+V3',
        explanation: '১. Zero: চিরন্তন/বৈজ্ঞানিক সত্য (If water boils, it turns into steam). ২. First: বাস্তব সম্ভাবনা (If it rains, we will cancel the game). ৩. Second: কাল্পনিক/বর্তমান অবাস্তব (If I were you, I would accept the offer). ৪. Third: অতীত অপূর্ণ ইচ্ছা (If he had studied, he would have passed).',
        exampleCorrect: 'If you heat ice, it melts. | If you invite me, I will come. | If I had a camera, I would take pictures. | If he had run faster, he could have won.',
        exampleIncorrect: 'If you will come, I will go. (Never use "will" in if-clause!) | If I had studied, I would pass.',
        examTrap: 'If-clause এ কখনো will, would বা shall বসে না! (If it will rain -> ভুল, সঠিক: If it rains)।',
        quickMemory: 'If+V1 -> Will+V1 | If+V2 -> Would+V1 | If+Had+V3 -> Would have+V3!',
        priority: 'must',
        examSource: '10th-45th BCS, All Universities'
      },
      {
        id: 'cond-2',
        ruleTitle: 'Conditional Inversion (Omitting "IF")',
        bengaliNote: '"If" তুলে দিয়ে Had, Were বা Should বাক্যের শুরুতে এনে ইনভার্সন করা হয়।',
        formula: 'Had + Subject + V3 ... , Subject + would have + V3 | Were + Subject ... , Subject + would + V1',
        explanation: 'If I had seen him, I would have told him -> Had I seen him, I would have told him. If I were a rich man, I would help the poor -> Were I a rich man, I would help the poor.',
        exampleCorrect: 'Had I known you were coming, I would have met you. | Had he been sincere, he would have succeeded.',
        exampleIncorrect: 'If had I known you were coming. | Had I known you, I would tell you.',
        examTrap: 'বাক্যের শুরুতে "Had + Subject + V3" দেখলে অপর অংশে অবশ্যই "would have / could have + V3" বসবে।',
        quickMemory: 'Had I seen = If I had seen -> must pair with WOULD HAVE + V3!',
        priority: 'must',
        examSource: '35th, 36th, 39th BCS'
      }
    ]
  },

  // 21. SUBJUNCTIVE MOOD
  {
    id: 'subjunctive-mastery',
    number: 21,
    title: 'The Subjunctive Mood: Mandative Verbs & Adjectives',
    bengaliTitle: 'সাবজাঙ্কটিভ মুড: আদেশ/প্রস্তাবসূচক ক্রিয়াপদের পর বেস ফর্ম',
    category: 'syntax_rules',
    priority: 'must',
    overview: 'কাউকে কোনো কিছু করার অনুরোধ, জোর, প্রস্তাব বা নির্দেশ বোঝাতে Subjunctive ব্যবহৃত হয়। এতে Subject এর পর Verb এর কোনো s/es, past form বা modal বসে না — শুধু Verb এর BASE FORM বসে।',
    rules: [
      {
        id: 'subj-1',
        ruleTitle: 'Mandative Verbs Followed by "That + Subject + BASE FORM"',
        bengaliNote: 'প্রস্তাব বা নির্দেশসূচক Verb এর পর that ক্লজে সর্বাবস্থায় Verb এর Base form (V1) বসে।',
        formula: 'Subject + Mandative Verb + THAT + Subject + BASE VERB (No s/es, no -ed, no modal)',
        explanation: 'Mandative Verbs: Advise, Ask, Command, Demand, Desire, Insist, Order, Prefer, Propose, Recommend, Request, Require, Suggest, Urge. এর পর that ক্লজে he/she থাকলেও verb এ s/es যুক্ত হবে না, be verb আসলে সরাসরি "be" বসবে, এবং negative করতে হলে সরাসরি "not + base verb" বসবে।',
        exampleCorrect: 'The doctor recommended that he stop smoking. (NOT stops/stopped) | I insisted that she be present. (NOT is/was) | We suggest that he not go there.',
        exampleIncorrect: 'The doctor recommended that he stops smoking. | I insisted that she should be present (British allows, but US/BCS exam prefers pure base form).',
        examTrap: 'He/she দেখে ভুলে verb এ s/es বা was/is দাগানো সবচেয়ে বড় ভুল! সর্বদা BASE FORM: be, do, go, have, stop.',
        quickMemory: 'Demand, Insist, Recommend, Suggest, Request + THAT + Subj + BASE FORM (be/go/do)!',
        priority: 'must',
        examSource: 'DU BBA IBA, 27th BCS, Bank PO'
      },
      {
        id: 'subj-2',
        ruleTitle: 'Mandative Adjectives Taking Subjunctive Base Form',
        bengaliNote: 'জরুরি বা গুরুত্বপূর্ণ নির্দেশক Adjective এর পর that ক্লজেও Verb এর Base Form বসে।',
        formula: 'It is + Adjective + THAT + Subject + BASE VERB',
        explanation: 'Mandative Adjectives: Crucial, Essential, Imperative, Important, Mandatory, Necessary, Obligatory, Urgent, Vital.',
        exampleCorrect: 'It is essential that every student attend the meeting. | It is imperative that he be informed immediately.',
        exampleIncorrect: 'It is essential that every student attends the meeting. | It is imperative that he is informed.',
        examTrap: 'পরীক্ষায় আসে: "It is necessary that he ___ (joins/join/should join) the conference." উত্তর: "join"।',
        quickMemory: 'It is essential / imperative / vital that + Subj + BASE VERB!',
        priority: 'must',
        examSource: 'CU, JNU, Bangladesh Bank AD'
      }
    ]
  },

  // 22. MODIFIERS & DANGLING MODIFIER TRAPS
  {
    id: 'modifiers-mastery',
    number: 22,
    title: 'Modifiers: Dangling & Misplaced Modifier Traps',
    bengaliTitle: 'মডিফায়ার: ড্যাংলিং বা ঝুলন্ত মডিফায়ারের ফাঁদ',
    category: 'syntax_rules',
    priority: 'must',
    overview: 'Dangling Modifier হলো এমন কোনো সূচনামূলক শব্দগুচ্ছ যা বাক্যের ব্যাকরণগত Subject কে সঠিকভাবে নির্দেশ করে না। Sentence correction ও BCS প্রিলিমিনারিতে এটি সবচেয়ে জনপ্রিয় প্রশ্ন।',
    rules: [
      {
        id: 'mod-1',
        ruleTitle: 'The Introductory Participle Subject Rule',
        bengaliNote: 'কমার আগের কাজের কর্তা আর কমার ঠিক পরের Subject অবশ্যই একই ব্যক্তি/বস্তু হতে হবে।',
        formula: 'Introductory V-ing / Having V3 Phrase , [DOER OF THAT ACTION as Subject] + Verb',
        explanation: 'ভুল: "Walking in the garden, a snake bit him." (বাগান দিয়ে কি সাপ হাঁটছিল? না! হেঁটেছিল সে)। সঠিক: "Walking in the garden, he was bitten by a snake." অথবা "While he was walking in the garden, a snake bit him."',
        exampleCorrect: 'Running quickly down the street, I caught the bus. | Having finished the assignment, she turned off the light.',
        exampleIncorrect: 'Running quickly down the street, the bus was caught by me. | Walking through the forest, the moon appeared bright.',
        examTrap: 'কমার ঠিক পরের শব্দটি যেন এমন না হয় যা শুরুর কাজটা করতে পারে না (e.g. "Walking in the garden, a flower caught my eye" — ফুল তো হাঁটে না!)।',
        quickMemory: 'কমা এর পরের Subject-ই শুরুর কাজের বাস্তব কর্তা হতে হবে!',
        priority: 'must',
        examSource: '20th, 38th BCS, DU IBA'
      }
    ]
  },

  // 23. PARALLELISM & REDUNDANCY
  {
    id: 'parallelism-redundancy',
    number: 23,
    title: 'Parallelism & Redundancy: Streamlining Sentences',
    bengaliTitle: 'সমান্তরালতা ও বাহুল্য দোষ পরিহার',
    category: 'syntax_rules',
    priority: 'must',
    overview: 'Parallelism (সমান্তরাল গঠন) নিশ্চিত করে যে সমন্বিত উপাদানগুলো একই ব্যাকরণিক রূপে থাকবে। Redundancy অপ্রয়োজনীয় পুনরাবৃত্ত শব্দ দূর করে।',
    rules: [
      {
        id: 'par-1',
        ruleTitle: 'Grammatical Parallelism in Lists and Comparisons',
        bengaliNote: 'কমা বা and/or দিয়ে যুক্ত সকল পদ একই ব্যাকরণিক রূপে (All Nouns, All V-ing, All Infinitives) হতে হবে।',
        formula: 'V-ing, V-ing, and V-ing | Noun, Noun, and Noun | To V1, (to) V1, and (to) V1',
        explanation: 'She likes dancing, reading, and writing. (সবগুলো Gerund). যদি লেখা হয় "She likes dancing, reading, and to write", তবে এটি Parallelism এর নিয়ম লঙ্ঘন করে এবং ভুল।',
        exampleCorrect: 'The teacher wanted to inspire, encourage, and educate the students. | He is noted for his honesty, integrity, and wisdom.',
        exampleIncorrect: 'She likes to dance, reading, and singing. | He is famous for his talent, honest, and kindness.',
        examTrap: 'পরীক্ষায় আসে: "He likes singing, swimming and ___." অপশন: to dance / dancing. সঠিক উত্তর: dancing।',
        quickMemory: 'Balance the sentence: Gerund pairs with Gerund, Noun pairs with Noun!',
        priority: 'must',
        examSource: '35th BCS, DU, Bank Recruitment'
      },
      {
        id: 'red-1',
        ruleTitle: 'Redundancy: Never Double Up Synonymous Words',
        bengaliNote: 'একই অর্থবোধক দুটি শব্দ পাশাপাশি ব্যবহার বাহুল্য দোষ (Redundancy)।',
        formula: 'Correct = Single word without duplicate particle',
        explanation: 'Return back -> Return (back বাহুল্য); Revert back -> Revert; Repeat again -> Repeat; Proceed forward -> Proceed; Advance forward -> Advance; Enter into -> Enter; Reason ... because -> Reason ... that; Adequate enough -> Adequate; New innovation -> Innovation; Twin brother -> Brother (unless biological twins context); Sufficient enough -> Sufficient.',
        exampleCorrect: 'He returned home yesterday. (NOT returned back) | Please repeat the sentence. (NOT repeat again)',
        exampleIncorrect: 'He returned back from London. | The reason he failed is because he was lazy.',
        examTrap: '"The reason why ... is because ..." ভুল! সঠিক: "The reason why ... is that ..."।',
        quickMemory: 'NO: return back, repeat again, proceed forward, enter into, reason because!',
        priority: 'must',
        examSource: '36th, 38th BCS, IBA'
      }
    ]
  },

  // 24. CLAUSES & PHRASES IDENTIFICATION
  {
    id: 'clause-phrase-mastery',
    number: 24,
    title: 'Phrase & Clause: Identification & Differences',
    bengaliTitle: 'শব্দগুচ্ছ ও খণ্ডবাক্য: শনাক্তকরণ ও কার্যকরী পার্থক্য',
    category: 'syntax_rules',
    priority: 'must',
    overview: 'Phrase এ কোনো Finite Verb থাকে না। Clause এ Subject এবং Finite Verb উভয়ই থাকে। পরীক্ষায় Noun Clause, Adjective Clause ও Adverb Clause শনাক্তকরণ অতি নিয়মিত প্রশ্ন।',
    rules: [
      {
        id: 'cp-1',
        ruleTitle: 'Noun Clause vs Adjective Clause vs Adverb Clause Identification',
        bengaliNote: 'কী (What) এর উত্তরে Noun Clause; Noun এর বর্ণনায় Adjective Clause; কখন/কোথায়/কেন/কীভাবে এর উত্তরে Adverb Clause।',
        formula: 'Answers "What?" = Noun Clause | Has Antecedent Noun = Adjective Clause | Answers When/Where/Why/How = Adverb Clause',
        explanation: '১. Noun Clause: "I know that he is honest" (What do I know? -> that he is honest = Noun clause). ২. Adjective Clause: "I know the man who came here" (who came here describes \'the man\' which is its antecedent). ৩. Adverb Clause: "I will call you when I arrive" (When will I call? = Adverb clause).',
        exampleCorrect: 'That honesty is the best policy is known to all. (Noun Clause as Subject) | This is the house where I was born. (Adjective Clause modifying house) | He wept because he was tired. (Adverb Clause of reason)',
        exampleIncorrect: 'I know the place where was he born. (Clause must have statement order)',
        examTrap: 'Who/where/that এর পূর্বে Antecedent (Noun) থাকলে তা Adjective Clause; Antecedent না থাকলে এবং পুরো ক্লজটি What এর উত্তর দিলে তা Noun Clause!',
        quickMemory: 'No Antecedent & answers "What" = Noun Clause; With Antecedent = Adjective Clause!',
        priority: 'must',
        examSource: '10th, 37th, 40th BCS'
      },
      {
        id: 'cp-2',
        ruleTitle: 'Phrase Identification: Noun, Adjective & Adverb Phrase',
        bengaliNote: 'Phrase এ কোনো Finite Verb থাকে না; এটি একক Parts of Speech এর মতো কাজ করে।',
        formula: 'Modifies Noun -> Adjective Phrase | Modifies Verb -> Adverb Phrase | Acts as S/O -> Noun Phrase',
        explanation: '১. "A woman with a veil over her face" -> with a veil modifies woman (Adjective phrase). ২. "He ran with great speed" -> with great speed explains HOW he ran (Adverb phrase). ৩. "To err is human" -> To err acts as subject (Noun phrase / Infinitive phrase).',
        exampleCorrect: 'The girl with long hair is my cousin. (Adjective phrase) | She sang in a sweet voice. (Adverb phrase)',
        exampleIncorrect: 'He ran fastly. (fast is already adverb)',
        examTrap: 'Preposition দিয়ে শুরু হলেও যদি Noun কে বিশেষায়িত করে তবে তা Adjective Phrase; আর Verb কে বিশেষায়িত করলে Adverbial Phrase।',
        quickMemory: 'Modifying Noun = Adjective Phrase; Modifying Verb = Adverbial Phrase!',
        priority: 'must',
        examSource: '38th, 40th BCS, RU'
      }
    ]
  },

  // 25. TAG QUESTIONS & EMBEDDED QUESTIONS
  {
    id: 'questions-mastery',
    number: 25,
    title: 'Tag Questions & Embedded Questions: Statement Order Traps',
    bengaliTitle: 'ট্যাগ প্রশ্ন ও অন্তর্নিহিত প্রশ্ন: বর্ণনামূলক ক্রমের নিয়ম',
    category: 'syntax_rules',
    priority: 'must',
    overview: 'ট্যাগ প্রশ্ন ও এমবেডেড প্রশ্নে সবচেয়ে বেশি ভুল হয় Auxiliary verb বাছাই এবং ক্লজের ভেতরের শব্দক্রমে (Word order)।',
    rules: [
      {
        id: 'tag-1',
        ruleTitle: 'Tag Question Rules: Everybody/Nobody -> Pronoun "THEY"',
        bengaliNote: 'Everybody, Everyone, Somebody, Nobody, None এর জন্য ট্যাগ প্রশ্নে Pronoun হিসেবে "they" এবং Verb ও Plural হয়।',
        formula: 'Everybody/Nobody/Everyone + Tag: [Auxiliary (Plural) + they?]',
        explanation: 'Everybody loves flowers, don’t they? (লক্ষণীয়: মূল বাক্যে loves singular হলেও ট্যাগে they এর সাথে don’t plural হয়েছে)। Nobody called, did they? (Nobody নিজেই negative, তাই tag positive)। Let’s go, shall we? Have a seat, will you?',
        exampleCorrect: 'Everybody knows this, don\'t they? | None of them attended, did they? | Let us play, shall we?',
        exampleIncorrect: 'Everybody knows this, doesn\'t he? | Let us go, won\'t you?',
        examTrap: 'Everybody এর সাথে মূল বাক্যে singular verb থাকলেও ট্যাগে "they" এর সাথে অবশ্যই plural auxiliary (don’t, aren’t, haven’t) বসবে।',
        quickMemory: 'Body/One subjects = THEY in tag (and PLURAL verb)! Let\'s = Shall we!',
        priority: 'must',
        examSource: '12th, 38th BCS, Primary'
      },
      {
        id: 'emb-1',
        ruleTitle: 'Embedded Questions ALWAYS Follow STATEMENT Order (Subject + Verb)',
        bengaliNote: 'কোনো প্রশ্নের ভেতরে অন্য কোনো প্রশ্ন ঢুকে থাকলে সেই ভেতরের অংশে সাধারণ বর্ণনামূলক ক্রম (S + V) হবে।',
        formula: 'Do you know / Can you tell me + WH-word + SUBJECT + VERB (NO auxiliary inversion!)',
        explanation: 'সরাসরি প্রশ্ন: "Where does he live?" কিন্তু Embedded প্রশ্ন: "Do you know where he lives?" (does বাদ যাবে এবং he lives হবে)। "Can you tell me what time is it?" ভুল; সঠিক: "Can you tell me what time it is?"',
        exampleCorrect: 'I don\'t know where he has gone. | Could you tell me what your name is?',
        exampleIncorrect: 'Do you know where does he live? | Tell me what is your name.',
        examTrap: 'পরীক্ষায় আসে: "Could you tell me where ___?" অপশন: a) is the post office b) the post office is. সঠিক উত্তর: b!',
        quickMemory: 'Embedded Question = WH + SUBJECT + VERB (NEVER Aux + Subj)!',
        priority: 'must',
        examSource: '28th BCS, DU IBA, Bank Recruitment'
      }
    ]
  },

  // 26. 40 HIGH-FREQUENCY ERROR SPOTTERS & PINPOINT CORRECTIONS
  {
    id: 'error-spotting-mastery',
    number: 26,
    title: 'Top 30 Examination Error Patterns: Wrong vs Correct',
    bengaliTitle: 'শীর্ষ ৩০টি ভুল শনাক্তকরণ ও বাক্য সংশোধন প্যাটার্ন',
    category: 'exam_traps',
    priority: 'must',
    overview: 'বিসিএস প্রিলিমিনারি ও ব্যাংক নিয়োগ পরীক্ষায় সরাসরি Sentence Correction বা Spotting the Error আকারে আসা প্রধান ৩০টি দ্বৈত ফাঁদ।',
    rules: [
      {
        id: 'err-1',
        ruleTitle: 'Incorrect Verb Form After "Did"',
        bengaliNote: 'Did এর পর সর্বদা Verb এর Base Form (V1) বসে।',
        formula: 'Did / Did not + V1 (Base Form only)',
        explanation: 'Did এর পর কখনো Past form (V2) বসে না।',
        exampleCorrect: 'He did not go to school. | Did you receive my letter?',
        exampleIncorrect: 'He did not went to school. | Did you received my letter?',
        examTrap: 'পরীক্ষায় "She did not went" দিয়ে ভুল খুঁজতে বলা হয়।',
        quickMemory: 'DID + V1 (Base)!',
        priority: 'must'
      },
      {
        id: 'err-2',
        ruleTitle: 'Each/Neither with Plural Pronoun Mismatch',
        bengaliNote: 'Each of the boys brought his book (their book নয়)।',
        formula: 'Each / Either / Neither of + Plural Noun + his/her (singular)',
        explanation: 'যেহেতু Each বা Neither অর্থগতভাবে singular, তাদের pronoun ও singular হতে হবে।',
        exampleCorrect: 'Each of the boys brought his own pen. | Everyone must do his or her duty.',
        exampleIncorrect: 'Each of the boys brought their pen. | Everyone must do their duty.',
        examTrap: 'Common mistake: Each of the students completed their homework.',
        quickMemory: 'Each/Everyone -> HIS/HER, not their!',
        priority: 'must'
      },
      {
        id: 'err-3',
        ruleTitle: 'Double Comparative & Double Superlative Error',
        bengaliNote: 'একসাথে দুটি তুলনামূলক বা অতিশয়োক্তি শব্দ ব্যবহার করা নিষিদ্ধ।',
        formula: 'No "more taller" / "most tallest"',
        explanation: 'Taller নিজেই comparative, তাই more taller ভুল। Best নিজেই superlative, তাই most best ভুল।',
        exampleCorrect: 'He is taller than Ali. | She is the smartest girl.',
        exampleIncorrect: 'He is more taller than Ali. | She is the most smartest girl.',
        examTrap: 'More better, most unique, more preferred — সবগুলোই মারাত্মক ভুল।',
        quickMemory: 'NO DOUBLE COMPARISON: Use either -er/-est OR more/most, NEVER BOTH!',
        priority: 'must'
      },
      {
        id: 'err-4',
        ruleTitle: 'Cope With (NOT Cope Up With)',
        bengaliNote: 'মানিয়ে নেওয়া অর্থে শুধু "Cope with" বসে, "Cope up with" অশুদ্ধ।',
        formula: 'Cope WITH (No "up")',
        explanation: 'ইংরেজি ব্যাকরণে "cope with" একটি প্রতিষ্ঠিত ফ্রেজ। ভারতীয় উপমহাদেশে প্রচলিত "cope up with" একটি অপপ্রয়োগ।',
        exampleCorrect: 'I cannot cope with this heavy workload.',
        exampleIncorrect: 'I cannot cope up with this heavy workload.',
        examTrap: 'পরীক্ষায় প্রায়ই "cope up with" দিয়ে কারেকশন করতে দেওয়া হয়। "up" বাদ দিলেই সঠিক।',
        quickMemory: 'Cope WITH (There is NO UP in cope)!',
        priority: 'must'
      },
      {
        id: 'err-5',
        ruleTitle: 'Married TO (NOT Married With)',
        bengaliNote: 'বিবাহিত অর্থে Married এর পর "to" বসে।',
        formula: 'Be + married + TO someone',
        explanation: 'He is married to a doctor. She was married to Mr. Khan.',
        exampleCorrect: 'Mamtaz was married to Shahjahan.',
        exampleIncorrect: 'Mamtaz was married with Shahjahan.',
        examTrap: 'বাংলায় "অমুকের সাথে বিবাহিত" ভাবলেও ইংরেজিতে with হবে না, to হবে।',
        quickMemory: 'Married TO (NOT with)!',
        priority: 'must'
      },
      {
        id: 'err-6',
        ruleTitle: 'Comprise of Error',
        bengaliNote: 'Active Voice এ Comprise এর পর "of" বসে না।',
        formula: 'Comprise + Object (NO "OF") = Consist OF',
        explanation: 'The committee comprises nine members (Active এ of নেই)। তবে Passive এ: The committee is comprised of nine members। অথবা: The committee consists of nine members।',
        exampleCorrect: 'The book comprises ten chapters. | The book consists of ten chapters.',
        exampleIncorrect: 'The book comprises of ten chapters.',
        examTrap: 'Comprise = Consist of; তাই Comprise এর ভেতর of লুকায়িত থাকে, আলাদা of লাগে না।',
        quickMemory: 'Consist takes OF; Comprise takes NO OF!',
        priority: 'must'
      }
    ]
  }
];

export const LAST_NIGHT_FORMULAS = [
  { topic: 'Noun Suffixes', formula: '-tion, -sion, -ment, -ness, -ance, -ence, -hood, -dom, -ship, -th, -ty, -cy, -al (denial, refusal)' },
  { topic: 'Verb Suffixes/Prefixes', formula: 'en- (enable, rich->enrich), -ify (beautify), -ize/-ise (realize), -en (shorten, widen), -ate' },
  { topic: 'Adjective Suffixes', formula: '-ful, -less, -able, -ible, -ous, -ive, -ic, -ish, -ent, -ant, -al, Noun+ly (friendly, lovely)' },
  { topic: 'Adverb Formation', formula: 'Adjective + ly = Adverb (Quickly, Happily, Nicely). To make Noun+ly into adverb: "in a + [Adj] + way/manner"' },
  { topic: 'Latin Plurals', formula: '-um -> -a (Medium->Media); -us -> -i (Radius->Radii); -is -> -es (Crisis->Crises); -on -> -a (Criterion->Criteria)' },
  { topic: 'Singular Measurements', formula: 'Ten miles is | Fifty thousand taka is | Two hours is (Single unit = Singular verb)' },
  { topic: 'Pronoun 231 vs 123', formula: 'Normal = 231 (You, he and I are); Confessing guilt/blame = 123 (I, you and he are)' },
  { topic: 'Subjunctive Mandative', formula: 'Insist/Suggest/Recommend/Demand/Order + THAT + Subj + BASE FORM (be, go, stop — no s/es, no was/did)' },
  { topic: 'Past Perfect Before/After', formula: 'Past Perfect + BEFORE + Past Indefinite | Past Indefinite + AFTER + Past Perfect' },
  { topic: 'Lest Formula', formula: 'Lest + Subject + SHOULD + Base Verb (Never use NOT or never with lest)' },
  { topic: 'No Sooner Formula', formula: 'No sooner had + S + V3 ... THAN + Past Indefinite (Watch out for THEN/WHEN traps!)' },
  { topic: 'It is high time', formula: 'It is high time + Subject + V2 (Past Indefinite) | It is high time + to + V1' },
  { topic: 'As if / Wish Unreal', formula: 'Present + AS IF / WISH + were / V2 | Past + AS IF + had + V3 (Always WERE, never was!)' },
  { topic: 'Causative Verbs', formula: 'Have + person + V1; Have + thing + V3; Get + person + to+V1; Get + thing + V3; Make/Let + person/thing + V1' },
  { topic: 'Adjective Order', formula: 'OSASCOMP = Opinion -> Size -> Age -> Shape -> Color -> Origin -> Material -> Purpose + Noun' },
  { topic: 'Latin Comparatives', formula: 'Senior, Junior, Superior, Inferior, Prior, Posterior, Preferable + TO (Never THAN, Never MORE)' },
  { topic: 'Of the two', formula: 'Subject + Verb + THE + Comparative + of the two (e.g. He is the taller of the two)' },
  { topic: 'Double Comparative', formula: 'The + Comparative ... , The + Comparative ... (The more you read, the more you learn)' },
  { topic: 'A vs The Number of', formula: 'A number of + Plural Noun + PLURAL VERB | The number of + Plural Noun + SINGULAR VERB' },
  { topic: 'Preposition of Die', formula: 'Disease/Hunger = OF; Overeating/Wound = FROM; Violence/Poison = BY; Country/Noble = FOR; Harness/Battle = IN' },
  { topic: 'Gerund vs Participle', formula: 'The + V-ing + of = Verbal Noun; For + V-ing = Gerund (sleeping pill); Is + V-ing = Participle (sleeping child)' },
  { topic: 'Embedded Question', formula: 'Do you know + WH-word + SUBJECT + VERB (No inversion, no does/did in middle!)' },
  { topic: 'Tag Question Exception', formula: 'Everybody/Nobody -> Pronoun is THEY (e.g. Everybody loves flowers, don\'t they?)' },
  { topic: 'Redundancy Traps', formula: 'NO: Return back, repeat again, proceed forward, enter into, reason because, new innovation' }
];

export const FIFTEEN_MINUTE_DRILL = [
  { question: 'Honey tastes ____.', options: ['sweetly', 'sweet', 'more sweet', 'sweetness'], ans: 'sweet', note: 'Taste is a linking verb; followed by adjective.' },
  { question: 'He is senior ____ me by three years.', options: ['than', 'to', 'from', 'with'], ans: 'to', note: 'Latin comparatives take "to", never "than".' },
  { question: 'Walk fast lest you ____ miss the train.', options: ['will', 'should', 'would', 'shall'], ans: 'should', note: 'Lest requires subject + should + V1.' },
  { question: 'It is high time we ____ our bad habits.', options: ['change', 'changed', 'should change', 'have changed'], ans: 'changed', note: 'It is high time + Subject + V2.' },
  { question: 'The jury ____ divided in their opinions.', options: ['was', 'were', 'is', 'has been'], ans: 'were', note: 'Noun of multitude with divided opinion takes plural verb and plural pronoun.' },
  { question: 'I look forward to ____ you soon.', options: ['hear', 'hearing', 'have heard', 'heard'], ans: 'hearing', note: 'Look forward to is followed by gerund (V-ing).' },
  { question: 'No sooner had we reached the station ____ the train left.', options: ['when', 'then', 'than', 'before'], ans: 'than', note: 'No sooner is paired with THAN.' },
  { question: 'The number of applicants ____ increasing.', options: ['is', 'are', 'were', 'have been'], ans: 'is', note: '"The number of" takes a singular verb.' },
  { question: 'He died ____ cholera.', options: ['from', 'of', 'by', 'for'], ans: 'of', note: 'Dying of disease or hunger takes "of".' },
  { question: 'The doctor recommended that he ____ smoking.', options: ['stops', 'stop', 'stopped', 'must stop'], ans: 'stop', note: 'Mandative subjunctive requires base form.' }
];
