/**
 * ISO-style language code values for user profile language preferences.
 *
 * Notes:
 * - Uses ISO 639-3 where practical.
 * - Keeps app-specific fallback values for user-entered/custom languages.
 * - Some aliases intentionally share the same code.
 */
export declare const Languages: {
  readonly Unspecified: 'und';
  readonly Unknown: 'und';
  readonly MultipleLanguages: 'mul';
  readonly NotApplicable: 'zxx';
  readonly NotListed: 'not_listed';
  readonly SelfDescribe: 'self_describe';
  readonly English: 'eng';
  readonly Spanish: 'spa';
  readonly French: 'fra';
  readonly German: 'deu';
  readonly Portuguese: 'por';
  readonly Italian: 'ita';
  readonly Dutch: 'nld';
  readonly Russian: 'rus';
  readonly Arabic: 'ara';
  readonly ModernStandardArabic: 'arb';
  readonly MandarinChinese: 'cmn';
  readonly Chinese: 'zho';
  readonly Hindi: 'hin';
  readonly Bengali: 'ben';
  readonly Urdu: 'urd';
  readonly Indonesian: 'ind';
  readonly Malay: 'msa';
  readonly Japanese: 'jpn';
  readonly Korean: 'kor';
  readonly Turkish: 'tur';
  readonly Vietnamese: 'vie';
  readonly Thai: 'tha';
  readonly Persian: 'fas';
  readonly Swahili: 'swa';
  readonly Cherokee: 'chr';
  readonly Navajo: 'nav';
  readonly Cree: 'cre';
  readonly Inuktitut: 'iku';
  readonly Greenlandic: 'kal';
  readonly Ojibwa: 'oji';
  readonly Mohawk: 'moh';
  readonly Dakota: 'dak';
  readonly Lakota: 'lkt';
  readonly Choctaw: 'cho';
  readonly Chickasaw: 'cic';
  readonly Muscogee: 'mus';
  readonly Apache: 'apa';
  readonly Blackfoot: 'bla';
  readonly Haida: 'hai';
  readonly Tlingit: 'tli';
  readonly Yupik: 'ypk';
  readonly Hawaiian: 'haw';
  readonly HaitianCreole: 'hat';
  readonly JamaicanCreoleEnglish: 'jam';
  readonly Garifuna: 'cab';
  readonly Yucateco: 'yua';
  readonly Kiche: 'quc';
  readonly Kaqchikel: 'cak';
  readonly Mam: 'mam';
  readonly Qeqchi: 'kek';
  readonly Nahuatl: 'nah';
  readonly ClassicalNahuatl: 'nci';
  readonly Quechua: 'que';
  readonly Aymara: 'aym';
  readonly Guarani: 'grn';
  readonly Mapudungun: 'arn';
  readonly Wayuu: 'guc';
  readonly ShipiboConibo: 'shp';
  readonly Ashaninka: 'cni';
  readonly Warao: 'wba';
  readonly Ticuna: 'tca';
  readonly Yanomami: 'wca';
  readonly Irish: 'gle';
  readonly ScottishGaelic: 'gla';
  readonly Welsh: 'cym';
  readonly Breton: 'bre';
  readonly Cornish: 'cor';
  readonly Manx: 'glv';
  readonly Basque: 'eus';
  readonly Catalan: 'cat';
  readonly Galician: 'glg';
  readonly Occitan: 'oci';
  readonly Corsican: 'cos';
  readonly Sardinian: 'srd';
  readonly Romansh: 'roh';
  readonly Luxembourgish: 'ltz';
  readonly Frisian: 'fry';
  readonly WesternFrisian: 'fry';
  readonly LowGerman: 'nds';
  readonly Limburgish: 'lim';
  readonly Walloon: 'wln';
  readonly Venetian: 'vec';
  readonly Neapolitan: 'nap';
  readonly Sicilian: 'scn';
  readonly Ligurian: 'lij';
  readonly Piedmontese: 'pms';
  readonly Lombard: 'lmo';
  readonly Danish: 'dan';
  readonly Swedish: 'swe';
  readonly Norwegian: 'nor';
  readonly NorwegianBokmal: 'nob';
  readonly NorwegianNynorsk: 'nno';
  readonly Icelandic: 'isl';
  readonly Faroese: 'fao';
  readonly Finnish: 'fin';
  readonly Estonian: 'est';
  readonly Sami: 'smi';
  readonly NorthernSami: 'sme';
  readonly InariSami: 'smn';
  readonly SkoltSami: 'sms';
  readonly LuleSami: 'smj';
  readonly SouthernSami: 'sma';
  readonly Polish: 'pol';
  readonly Czech: 'ces';
  readonly Slovak: 'slk';
  readonly Hungarian: 'hun';
  readonly Romanian: 'ron';
  readonly Moldovan: 'mol';
  readonly Ukrainian: 'ukr';
  readonly Belarusian: 'bel';
  readonly Lithuanian: 'lit';
  readonly Latvian: 'lav';
  readonly Rusyn: 'rue';
  readonly Romani: 'rom';
  readonly Yiddish: 'yid';
  readonly Albanian: 'sqi';
  readonly Greek: 'ell';
  readonly Bulgarian: 'bul';
  readonly Macedonian: 'mkd';
  readonly Serbian: 'srp';
  readonly Croatian: 'hrv';
  readonly Bosnian: 'bos';
  readonly Slovene: 'slv';
  readonly Montenegrin: 'cnr';
  readonly Aromanian: 'rup';
  readonly Georgian: 'kat';
  readonly Armenian: 'hye';
  readonly Azerbaijani: 'aze';
  readonly Chechen: 'che';
  readonly Avaric: 'ava';
  readonly Abkhazian: 'abk';
  readonly Ossetian: 'oss';
  readonly Ingush: 'inh';
  readonly Lezgian: 'lez';
  readonly Kabardian: 'kbd';
  readonly Hebrew: 'heb';
  readonly Kurdish: 'kur';
  readonly NorthernKurdish: 'kmr';
  readonly CentralKurdish: 'ckb';
  readonly SouthernKurdish: 'sdh';
  readonly Aramaic: 'arc';
  readonly Syriac: 'syr';
  readonly AssyrianNeoAramaic: 'aii';
  readonly ChaldeanNeoAramaic: 'cld';
  readonly Turoyo: 'tru';
  readonly ArmenianWestern: 'hyw';
  readonly ArmenianEastern: 'hye';
  readonly EgyptianArabic: 'arz';
  readonly MoroccanArabic: 'ary';
  readonly AlgerianArabic: 'arq';
  readonly TunisianArabic: 'aeb';
  readonly LibyanArabic: 'ayl';
  readonly HassaniyaArabic: 'mey';
  readonly Berber: 'ber';
  readonly Tamazight: 'tzm';
  readonly Tachelhit: 'shi';
  readonly Kabyle: 'kab';
  readonly Tarifit: 'rif';
  readonly Tuareg: 'tmh';
  readonly Coptic: 'cop';
  readonly Akan: 'aka';
  readonly Twi: 'twi';
  readonly Fante: 'fat';
  readonly Ewe: 'ewe';
  readonly Fon: 'fon';
  readonly Yoruba: 'yor';
  readonly Igbo: 'ibo';
  readonly Hausa: 'hau';
  readonly Fulah: 'ful';
  readonly Wolof: 'wol';
  readonly Mandinka: 'mnk';
  readonly Bambara: 'bam';
  readonly Dyula: 'dyu';
  readonly Soninke: 'snk';
  readonly Songhai: 'son';
  readonly Kanuri: 'kau';
  readonly Tiv: 'tiv';
  readonly Edo: 'bin';
  readonly Efik: 'efi';
  readonly Ibibio: 'ibb';
  readonly Nupe: 'nup';
  readonly Ga: 'gaa';
  readonly Krio: 'kri';
  readonly Mende: 'men';
  readonly Temne: 'tem';
  readonly Susu: 'sus';
  readonly Vai: 'vai';
  readonly Lingala: 'lin';
  readonly Kongo: 'kon';
  readonly Kikongo: 'kng';
  readonly LubaKatanga: 'lub';
  readonly LubaLulua: 'lua';
  readonly Mongo: 'lol';
  readonly Fang: 'fan';
  readonly Sango: 'sag';
  readonly Gbaya: 'gba';
  readonly Zande: 'zne';
  readonly Amharic: 'amh';
  readonly Tigrinya: 'tir';
  readonly Tigre: 'tig';
  readonly Oromo: 'orm';
  readonly Somali: 'som';
  readonly Afar: 'aar';
  readonly Sidamo: 'sid';
  readonly Wolaytta: 'wal';
  readonly Kamba: 'kam';
  readonly Kikuyu: 'kik';
  readonly Luo: 'luo';
  readonly Kalenjin: 'kln';
  readonly Ganda: 'lug';
  readonly Nyankole: 'nyn';
  readonly Rwanda: 'kin';
  readonly Rundi: 'run';
  readonly Sukuma: 'suk';
  readonly Nyamwezi: 'nym';
  readonly Maasai: 'mas';
  readonly Dinka: 'din';
  readonly Nuer: 'nus';
  readonly Afrikaans: 'afr';
  readonly Zulu: 'zul';
  readonly Xhosa: 'xho';
  readonly SouthernSotho: 'sot';
  readonly NorthernSotho: 'nso';
  readonly Tswana: 'tsn';
  readonly Tsonga: 'tso';
  readonly Swati: 'ssw';
  readonly Venda: 'ven';
  readonly Ndebele: 'nbl';
  readonly Shona: 'sna';
  readonly Nyanja: 'nya';
  readonly Chewa: 'nya';
  readonly Bemba: 'bem';
  readonly TongaZambia: 'toi';
  readonly Lozi: 'loz';
  readonly Herero: 'her';
  readonly Ndonga: 'ndo';
  readonly Kinyarwanda: 'kin';
  readonly Malagasy: 'mlg';
  readonly Comorian: 'swb';
  readonly MauritianCreole: 'mfe';
  readonly SeychelloisCreole: 'crs';
  readonly Kazakh: 'kaz';
  readonly Kyrgyz: 'kir';
  readonly Uzbek: 'uzb';
  readonly Turkmen: 'tuk';
  readonly Tajik: 'tgk';
  readonly Karakalpak: 'kaa';
  readonly Uyghur: 'uig';
  readonly Tatar: 'tat';
  readonly Bashkir: 'bak';
  readonly Chuvash: 'chv';
  readonly Mongolian: 'mon';
  readonly Buryat: 'bua';
  readonly Kalmyk: 'xal';
  readonly Sanskrit: 'san';
  readonly Pali: 'pli';
  readonly Punjabi: 'pan';
  readonly Gujarati: 'guj';
  readonly Marathi: 'mar';
  readonly Konkani: 'kok';
  readonly Sindhi: 'snd';
  readonly Nepali: 'nep';
  readonly Sinhala: 'sin';
  readonly Tamil: 'tam';
  readonly Telugu: 'tel';
  readonly Kannada: 'kan';
  readonly Malayalam: 'mal';
  readonly Odia: 'ori';
  readonly Assamese: 'asm';
  readonly Maithili: 'mai';
  readonly Bhojpuri: 'bho';
  readonly Magahi: 'mag';
  readonly Dogri: 'doi';
  readonly Kashmiri: 'kas';
  readonly Manipuri: 'mni';
  readonly Bodo: 'brx';
  readonly Santali: 'sat';
  readonly Mundari: 'unr';
  readonly Kurukh: 'kru';
  readonly Dzongkha: 'dzo';
  readonly Balti: 'bft';
  readonly Pashto: 'pus';
  readonly Dari: 'prs';
  readonly Balochi: 'bal';
  readonly Brahui: 'brh';
  readonly Cantonese: 'yue';
  readonly WuChinese: 'wuu';
  readonly MinNanChinese: 'nan';
  readonly HakkaChinese: 'hak';
  readonly GanChinese: 'gan';
  readonly XiangChinese: 'hsn';
  readonly ClassicalChinese: 'lzh';
  readonly Tibetan: 'bod';
  readonly StandardTibetan: 'bod';
  readonly Zhuang: 'zha';
  readonly Yi: 'iii';
  readonly Hmong: 'hmn';
  readonly Miao: 'hmn';
  readonly Manchu: 'mnc';
  readonly Ainu: 'ain';
  readonly Ryukyuan: 'jpx';
  readonly Okinawan: 'ryu';
  readonly Burmese: 'mya';
  readonly Khmer: 'khm';
  readonly Lao: 'lao';
  readonly Shan: 'shn';
  readonly Karen: 'kar';
  readonly SgawKaren: 'ksw';
  readonly PwoKaren: 'pww';
  readonly Mon: 'mnw';
  readonly HmongDaw: 'mww';
  readonly Cebuano: 'ceb';
  readonly Tagalog: 'tgl';
  readonly Filipino: 'fil';
  readonly Ilocano: 'ilo';
  readonly Hiligaynon: 'hil';
  readonly Waray: 'war';
  readonly Bikol: 'bik';
  readonly Kapampangan: 'pam';
  readonly Pangasinan: 'pag';
  readonly Javanese: 'jav';
  readonly Sundanese: 'sun';
  readonly Madurese: 'mad';
  readonly Balinese: 'ban';
  readonly Acehnese: 'ace';
  readonly Minangkabau: 'min';
  readonly Batak: 'btk';
  readonly Iban: 'iba';
  readonly Tetum: 'tet';
  readonly Cham: 'cha';
  readonly Maori: 'mri';
  readonly Samoan: 'smo';
  readonly Tongan: 'ton';
  readonly Fijian: 'fij';
  readonly Tahitian: 'tah';
  readonly Rarotongan: 'rar';
  readonly Niuean: 'niu';
  readonly Tokelauan: 'tkl';
  readonly Tuvaluan: 'tvl';
  readonly Gilbertese: 'gil';
  readonly Marshallese: 'mah';
  readonly Nauruan: 'nau';
  readonly Palauan: 'pau';
  readonly Chamorro: 'cha';
  readonly Bislama: 'bis';
  readonly TokPisin: 'tpi';
  readonly HiriMotu: 'hmo';
  readonly Motu: 'meu';
  readonly Rotuman: 'rtm';
  readonly AmericanSignLanguage: 'ase';
  readonly BritishSignLanguage: 'bfi';
  readonly AustralianSignLanguage: 'asf';
  readonly NewZealandSignLanguage: 'nzs';
  readonly IrishSignLanguage: 'isg';
  readonly FrenchSignLanguage: 'fsl';
  readonly GermanSignLanguage: 'gsg';
  readonly SpanishSignLanguage: 'ssp';
  readonly CatalanSignLanguage: 'csc';
  readonly ItalianSignLanguage: 'ise';
  readonly PortugueseSignLanguage: 'psr';
  readonly BrazilianSignLanguage: 'bzs';
  readonly MexicanSignLanguage: 'mfs';
  readonly JapaneseSignLanguage: 'jsl';
  readonly KoreanSignLanguage: 'kvk';
  readonly ChineseSignLanguage: 'csl';
  readonly IndoPakistaniSignLanguage: 'ins';
  readonly SouthAfricanSignLanguage: 'sfs';
  readonly Latin: 'lat';
  readonly AncientGreek: 'grc';
  readonly OldEnglish: 'ang';
  readonly MiddleEnglish: 'enm';
  readonly OldNorse: 'non';
  readonly Gothic: 'got';
  readonly Akkadian: 'akk';
  readonly Sumerian: 'sux';
  readonly AncientEgyptian: 'egy';
  readonly ClassicalSyriac: 'syc';
  readonly OldPersian: 'peo';
  readonly Avestan: 'ave';
  readonly ChurchSlavonic: 'chu';
  readonly ClassicalArmenian: 'xcl';
  readonly ClassicalMandaic: 'myz';
  readonly ClassicalNewari: 'nwc';
  readonly ClassicalTibetan: 'xct';
  readonly ClassicalMongolian: 'cmg';
};
export type Languages = (typeof Languages)[keyof typeof Languages];
export declare const DefaultLanguage: 'und';
export declare const LanguageValues: (
  | 'und'
  | 'mul'
  | 'zxx'
  | 'not_listed'
  | 'self_describe'
  | 'eng'
  | 'spa'
  | 'fra'
  | 'deu'
  | 'por'
  | 'ita'
  | 'nld'
  | 'rus'
  | 'ara'
  | 'arb'
  | 'cmn'
  | 'zho'
  | 'hin'
  | 'ben'
  | 'urd'
  | 'ind'
  | 'msa'
  | 'jpn'
  | 'kor'
  | 'tur'
  | 'vie'
  | 'tha'
  | 'fas'
  | 'swa'
  | 'chr'
  | 'nav'
  | 'cre'
  | 'iku'
  | 'kal'
  | 'oji'
  | 'moh'
  | 'dak'
  | 'lkt'
  | 'cho'
  | 'cic'
  | 'mus'
  | 'apa'
  | 'bla'
  | 'hai'
  | 'tli'
  | 'ypk'
  | 'haw'
  | 'hat'
  | 'jam'
  | 'cab'
  | 'yua'
  | 'quc'
  | 'cak'
  | 'mam'
  | 'kek'
  | 'nah'
  | 'nci'
  | 'que'
  | 'aym'
  | 'grn'
  | 'arn'
  | 'guc'
  | 'shp'
  | 'cni'
  | 'wba'
  | 'tca'
  | 'wca'
  | 'gle'
  | 'gla'
  | 'cym'
  | 'bre'
  | 'cor'
  | 'glv'
  | 'eus'
  | 'cat'
  | 'glg'
  | 'oci'
  | 'cos'
  | 'srd'
  | 'roh'
  | 'ltz'
  | 'fry'
  | 'nds'
  | 'lim'
  | 'wln'
  | 'vec'
  | 'nap'
  | 'scn'
  | 'lij'
  | 'pms'
  | 'lmo'
  | 'dan'
  | 'swe'
  | 'nor'
  | 'nob'
  | 'nno'
  | 'isl'
  | 'fao'
  | 'fin'
  | 'est'
  | 'smi'
  | 'sme'
  | 'smn'
  | 'sms'
  | 'smj'
  | 'sma'
  | 'pol'
  | 'ces'
  | 'slk'
  | 'hun'
  | 'ron'
  | 'mol'
  | 'ukr'
  | 'bel'
  | 'lit'
  | 'lav'
  | 'rue'
  | 'rom'
  | 'yid'
  | 'sqi'
  | 'ell'
  | 'bul'
  | 'mkd'
  | 'srp'
  | 'hrv'
  | 'bos'
  | 'slv'
  | 'cnr'
  | 'rup'
  | 'kat'
  | 'hye'
  | 'aze'
  | 'che'
  | 'ava'
  | 'abk'
  | 'oss'
  | 'inh'
  | 'lez'
  | 'kbd'
  | 'heb'
  | 'kur'
  | 'kmr'
  | 'ckb'
  | 'sdh'
  | 'arc'
  | 'syr'
  | 'aii'
  | 'cld'
  | 'tru'
  | 'hyw'
  | 'arz'
  | 'ary'
  | 'arq'
  | 'aeb'
  | 'ayl'
  | 'mey'
  | 'ber'
  | 'tzm'
  | 'shi'
  | 'kab'
  | 'rif'
  | 'tmh'
  | 'cop'
  | 'aka'
  | 'twi'
  | 'fat'
  | 'ewe'
  | 'fon'
  | 'yor'
  | 'ibo'
  | 'hau'
  | 'ful'
  | 'wol'
  | 'mnk'
  | 'bam'
  | 'dyu'
  | 'snk'
  | 'son'
  | 'kau'
  | 'tiv'
  | 'bin'
  | 'efi'
  | 'ibb'
  | 'nup'
  | 'gaa'
  | 'kri'
  | 'men'
  | 'tem'
  | 'sus'
  | 'vai'
  | 'lin'
  | 'kon'
  | 'kng'
  | 'lub'
  | 'lua'
  | 'lol'
  | 'fan'
  | 'sag'
  | 'gba'
  | 'zne'
  | 'amh'
  | 'tir'
  | 'tig'
  | 'orm'
  | 'som'
  | 'aar'
  | 'sid'
  | 'wal'
  | 'kam'
  | 'kik'
  | 'luo'
  | 'kln'
  | 'lug'
  | 'nyn'
  | 'kin'
  | 'run'
  | 'suk'
  | 'nym'
  | 'mas'
  | 'din'
  | 'nus'
  | 'afr'
  | 'zul'
  | 'xho'
  | 'sot'
  | 'nso'
  | 'tsn'
  | 'tso'
  | 'ssw'
  | 'ven'
  | 'nbl'
  | 'sna'
  | 'nya'
  | 'bem'
  | 'toi'
  | 'loz'
  | 'her'
  | 'ndo'
  | 'mlg'
  | 'swb'
  | 'mfe'
  | 'crs'
  | 'kaz'
  | 'kir'
  | 'uzb'
  | 'tuk'
  | 'tgk'
  | 'kaa'
  | 'uig'
  | 'tat'
  | 'bak'
  | 'chv'
  | 'mon'
  | 'bua'
  | 'xal'
  | 'san'
  | 'pli'
  | 'pan'
  | 'guj'
  | 'mar'
  | 'kok'
  | 'snd'
  | 'nep'
  | 'sin'
  | 'tam'
  | 'tel'
  | 'kan'
  | 'mal'
  | 'ori'
  | 'asm'
  | 'mai'
  | 'bho'
  | 'mag'
  | 'doi'
  | 'kas'
  | 'mni'
  | 'brx'
  | 'sat'
  | 'unr'
  | 'kru'
  | 'dzo'
  | 'bft'
  | 'pus'
  | 'prs'
  | 'bal'
  | 'brh'
  | 'yue'
  | 'wuu'
  | 'nan'
  | 'hak'
  | 'gan'
  | 'hsn'
  | 'lzh'
  | 'bod'
  | 'zha'
  | 'iii'
  | 'hmn'
  | 'mnc'
  | 'ain'
  | 'jpx'
  | 'ryu'
  | 'mya'
  | 'khm'
  | 'lao'
  | 'shn'
  | 'kar'
  | 'ksw'
  | 'pww'
  | 'mnw'
  | 'mww'
  | 'ceb'
  | 'tgl'
  | 'fil'
  | 'ilo'
  | 'hil'
  | 'war'
  | 'bik'
  | 'pam'
  | 'pag'
  | 'jav'
  | 'sun'
  | 'mad'
  | 'ban'
  | 'ace'
  | 'min'
  | 'btk'
  | 'iba'
  | 'tet'
  | 'cha'
  | 'mri'
  | 'smo'
  | 'ton'
  | 'fij'
  | 'tah'
  | 'rar'
  | 'niu'
  | 'tkl'
  | 'tvl'
  | 'gil'
  | 'mah'
  | 'nau'
  | 'pau'
  | 'bis'
  | 'tpi'
  | 'hmo'
  | 'meu'
  | 'rtm'
  | 'ase'
  | 'bfi'
  | 'asf'
  | 'nzs'
  | 'isg'
  | 'fsl'
  | 'gsg'
  | 'ssp'
  | 'csc'
  | 'ise'
  | 'psr'
  | 'bzs'
  | 'mfs'
  | 'jsl'
  | 'kvk'
  | 'csl'
  | 'ins'
  | 'sfs'
  | 'lat'
  | 'grc'
  | 'ang'
  | 'enm'
  | 'non'
  | 'got'
  | 'akk'
  | 'sux'
  | 'egy'
  | 'syc'
  | 'peo'
  | 'ave'
  | 'chu'
  | 'xcl'
  | 'myz'
  | 'nwc'
  | 'xct'
  | 'cmg'
)[];
export declare function isLanguage(value: unknown): value is Languages;
