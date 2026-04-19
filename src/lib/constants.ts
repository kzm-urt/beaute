import type { Category, Product } from "@/types";

export const CAT_META: Record<Category, { icon: string; color: string; accent: string; dark: string }> = {
  スキンケア:   { icon: "🌸", color: "#FDE8EC", accent: "#C4556A", dark: "#8B2E3F" },
  ヘアケア:     { icon: "💆", color: "#E0EEF8", accent: "#4A8BAD", dark: "#2C5F78" },
  メイク:       { icon: "💄", color: "#F5D5EA", accent: "#AD4A8B", dark: "#7A2C61" },
  ボディ:       { icon: "🫧", color: "#D5F0E8", accent: "#4AAD8B", dark: "#2C7861" },
  UVケア:       { icon: "☀️", color: "#FDF0D5", accent: "#C49A2A", dark: "#8A6C10" },
  フレグランス: { icon: "🌹", color: "#EAD5F5", accent: "#8B4AAD", dark: "#612C78" },
  ネイル:       { icon: "💅", color: "#F5D8D8", accent: "#AD4A4A", dark: "#782C2C" },
  サプリ:       { icon: "💊", color: "#D5F0D5", accent: "#4AAD4A", dark: "#2C782C" },
};

export const PRODUCTS: Product[] = [
  // スキンケア
  { id:1,  cat:"スキンケア",   sub:"クリーム",       name:"CICAクリーム",                  brand:"Dr.Jart+",       price:3960,  rating:4.8, rev:23100, free:true,  desc:"ツボクサエキスで炎症を鎮め、強力なバリアを形成。敏感肌の定番。",           tags:["敏感肌","赤み鎮静","保湿","乾燥"],                   video:{title:"敏感肌が1週間試した【CICAクリーム比較】",views:"201万",url:"#"} },
  { id:2,  cat:"スキンケア",   sub:"美容液",          name:"ナイアシンアミド10%+亜鉛1%",     brand:"The Ordinary",   price:1540,  rating:4.4, rev:18900, free:true,  desc:"コスパ最強の毛穴・くすみ対策。ナイアシンアミド10%配合。",                  tags:["毛穴","くすみ","皮脂コントロール","混合肌"],          video:{title:"プチプラで毛穴消えた話｜1ヶ月検証",views:"156万",url:"#"} },
  { id:3,  cat:"スキンケア",   sub:"化粧水",          name:"極潤ヒアルロン液",               brand:"肌ラボ",          price:880,   rating:4.6, rev:45200, free:true,  desc:"5種のヒアルロン酸配合。とろみのある高保湿化粧水。コスパ王者。",            tags:["乾燥","保湿","敏感肌","プチプラ"],                    video:{title:"【肌ラボ】毎日使える保湿化粧水の正解",views:"89万",url:"#"} },
  { id:4,  cat:"スキンケア",   sub:"美容液",          name:"レチノールセラム 0.3%",           brand:"Paula's Choice", price:7700,  rating:4.7, rev:8400,  free:false, desc:"医薬品グレードのレチノール。エイジングケアの最終兵器。夜用。",              tags:["エイジングケア","ハリ","シワ","毛穴"],                video:{title:"皮膚科医が解説｜レチノールの正しい使い方",views:"312万",url:"#"} },
  { id:5,  cat:"スキンケア",   sub:"洗顔",            name:"酵素洗顔パウダー",               brand:"FANCL",          price:1980,  rating:4.5, rev:31000, free:false, desc:"酵素がタンパク汚れを分解。毛穴の黒ずみ・角栓にアプローチ。",                tags:["毛穴","角栓","乾燥肌","敏感肌"],                     video:{title:"毛穴レス肌への近道【酵素洗顔比較】",views:"67万",url:"#"} },
  // ヘアケア
  { id:6,  cat:"ヘアケア",     sub:"ヘアオイル",      name:"エルジューダ MO",                brand:"ミルボン",        price:2530,  rating:4.8, rev:12400, free:true,  desc:"モロッカンオイル配合。高熱から髪を守る熱保護機能あり。アイロン前に◎",    tags:["ヘアオイル","熱保護あり","しっとり","剛毛・硬め"],    video:{title:"【神ヘアオイル】エルジューダMOの正しい使い方",views:"89万",url:"#"} },
  { id:7,  cat:"ヘアケア",     sub:"ヘアオイル",      name:"N.ポリッシュオイル",              brand:"ナプラ",          price:3080,  rating:4.6, rev:9800,  free:true,  desc:"スタイリング兼用マルチオイル。重さゼロでツヤだけ与える。熱保護なし。",     tags:["ヘアオイル","熱保護なし","ツヤ感","細め・柔らか"],   video:{title:"N.ポリッシュ｜TikTokで話題の使い方3選",views:"124万",url:"#"} },
  { id:8,  cat:"ヘアケア",     sub:"シャンプー",      name:"ボタニカルシャンプー モイスト",   brand:"BOTANIST",       price:1650,  rating:4.3, rev:28600, free:true,  desc:"植物由来成分90%以上。泡立ちよく、しっとりまとまる髪へ。",                  tags:["乾燥","しっとり","カラー毛","ダメージ毛"],            video:{title:"ボタニスト本当にいいの？美容師が本音レビュー",views:"45万",url:"#"} },
  { id:9,  cat:"ヘアケア",     sub:"トリートメント",  name:"ユイル スブリム ビューテ",       brand:"Kérastase",      price:6600,  rating:4.9, rev:3400,  free:false, desc:"サロン専売級補修力。カラー褪色を防ぎながら内部から集中補修。",              tags:["熱保護あり","ダメージ補修","剛毛・硬め","カラー毛"],  video:{title:"【美容師本音】ケラスターゼは本当に効く？",views:"45万",url:"#"} },
  { id:10, cat:"ヘアケア",     sub:"ヘアマスク",      name:"PRO HAIR MASK ディープモイスト",  brand:"LUX",            price:1408,  rating:4.2, rev:15200, free:false, desc:"ボンドケア技術で毛髪内部の結合を補修。週2回のサロン級集中ケア。",          tags:["ダメージ補修","乾燥","カラー毛","しっとり"],           video:{title:"市販トリートメント最強決定戦2024",views:"178万",url:"#"} },
  // メイク
  { id:11, cat:"メイク",       sub:"ファンデーション", name:"ライトリフレクティング ファンデ", brand:"NARS",           price:7150,  rating:4.6, rev:6700,  free:true,  desc:"光を味方に自然なカバー力。密着力が高くテカリにくい。",                      tags:["混合肌","毛穴","カバー","崩れにくい"],                video:{title:"NARS新作ファンデ｜6時間後の仕上がりを見て",views:"98万",url:"#"} },
  { id:12, cat:"メイク",       sub:"リップ",          name:"Juicy Lasting Tint",            brand:"rom&nd",         price:1430,  rating:4.7, rev:22300, free:true,  desc:"韓国コスメ発の超優秀ティント。落ちにくく発色が鮮やか。",                    tags:["プチプラ","発色","落ちにくい","韓国コスメ"],           video:{title:"rom&nd全色レビュー｜どれが一番映える？",views:"203万",url:"#"} },
  { id:13, cat:"メイク",       sub:"チーク",          name:"クリームチーク",                 brand:"CANMAKE",        price:748,   rating:4.5, rev:41200, free:true,  desc:"ジューシーな血色感。指でぽんぽんなじませるだけ。超プチプラ。",              tags:["プチプラ","血色感","ナチュラル","初心者向け"],         video:{title:"キャンメイクチーク神すぎ問題【全色比較】",views:"156万",url:"#"} },
  { id:14, cat:"メイク",       sub:"アイシャドウ",    name:"Multi Eye Color Palette",       brand:"3CE",            price:3520,  rating:4.4, rev:9100,  free:false, desc:"韓国ブランドの洗練パレット。マットからグリッターまで12色展開。",              tags:["韓国コスメ","バリエーション","デイリー","パーティー"], video:{title:"3CEパレット全種比較｜初心者でも使えるのは？",views:"67万",url:"#"} },
  { id:15, cat:"メイク",       sub:"コンシーラー",    name:"カバーフィットコンシーラー",     brand:"Cezanne",        price:638,   rating:4.3, rev:18800, free:false, desc:"クマ・毛穴・ニキビ跡をカバー。ヨレにくくプチプラで優秀。",                  tags:["プチプラ","クマ","ニキビ跡","初心者向け"],             video:{title:"コンシーラーの正しい使い方｜プロが解説",views:"89万",url:"#"} },
  // ボディ
  { id:16, cat:"ボディ",       sub:"ボディクリーム",  name:"INTACT ボディクリーム",          brand:"Nivea",          price:1078,  rating:4.4, rev:19300, free:true,  desc:"セラミド配合で乾燥肌をしっかり保湿。伸びがよく浸透力高い。",                tags:["乾燥","保湿","プチプラ","敏感肌OK"],                  video:{title:"ニベアの底力｜コスパ最強ボディケア",views:"78万",url:"#"} },
  { id:17, cat:"ボディ",       sub:"スクラブ",        name:"ソルト & フラワー スクラブ",     brand:"SABON",          price:4290,  rating:4.6, rev:5600,  free:true,  desc:"死海の塩とフラワーオイルで全身をつるつるに。香りが最高。",                  tags:["角質ケア","保湿","香り","ギフト"],                    video:{title:"SABON神スクラブ｜使い方と効果を徹底解説",views:"34万",url:"#"} },
  { id:18, cat:"ボディ",       sub:"ローション",      name:"エターナルゴールド バーム",      brand:"Aesop",          price:8800,  rating:4.8, rev:2800,  free:false, desc:"タスマニアペッパーリーフ配合。肌をなめらかに整えるラグジュアリーバーム。",  tags:["高保湿","香り","ラグジュアリー","ギフト"],             video:{title:"Aesopで変わった私の肌【高級ボディケア】",views:"25万",url:"#"} },
  // UVケア
  { id:19, cat:"UVケア",       sub:"日焼け止め",      name:"クロノビューティ SPF50+",        brand:"ALLIE",          price:1980,  rating:4.7, rev:31400, free:true,  desc:"汗・水・皮脂に強い。ウォータープルーフで一日中UV防御。",                    tags:["SPF50+","ウォータープルーフ","混合肌"],               video:{title:"日焼け止め最強ランキング2024【皮膚科医監修】",views:"312万",url:"#"} },
  { id:20, cat:"UVケア",       sub:"日焼け止め",      name:"トーンアップ UV ラベンダー",     brand:"SKIN AQUA",      price:990,   rating:4.5, rev:28700, free:true,  desc:"ラベンダーカラーでくすみを補正。美容液成分で肌を守りながら整える。",        tags:["くすみ補正","保湿","プチプラ","下地兼用"],             video:{title:"スキンアクアトーンアップ全色比較",views:"145万",url:"#"} },
  { id:21, cat:"UVケア",       sub:"日焼け止め",      name:"プロテクティブ UVファンデ",      brand:"IPSA",           price:5500,  rating:4.6, rev:4100,  free:false, desc:"UV防止＋ファンデ機能を兼備。ハイエンドな仕上がりで崩れにくい。",            tags:["SPF50+","下地兼用","高保湿","エイジングケア"],         video:{title:"イプサ日焼け止め｜一日中崩れない理由",views:"28万",url:"#"} },
  // フレグランス
  { id:22, cat:"フレグランス", sub:"香水",            name:"ピオニー＆ブラッシュスエード",    brand:"Jo Malone",      price:22000, rating:4.9, rev:4500,  free:true,  desc:"甘く上品なフローラル。ピオニーとスエードのエレガントな香り。",              tags:["フローラル","甘め","デート","ギフト"],                 video:{title:"ジョーマローン全香水ランキング｜プロが正直に",views:"89万",url:"#"} },
  { id:23, cat:"フレグランス", sub:"ボディミスト",    name:"ローズジャスミン ボディミスト",  brand:"The Body Shop",  price:2970,  rating:4.3, rev:8900,  free:true,  desc:"フレッシュなローズとジャスミン。日常使いしやすい軽い香り。",                tags:["フローラル","軽め","プチプラ","デイリー"],             video:{title:"プチプラ香水の最適解｜ボディミスト比較",views:"67万",url:"#"} },
  { id:24, cat:"フレグランス", sub:"香水",            name:"N°5 オードゥパルファム",         brand:"CHANEL",         price:38500, rating:4.8, rev:2100,  free:false, desc:"100年以上愛され続ける伝説の香り。アルデヒドフローラルの代名詞。",            tags:["フローラル","クラシック","大人","ラグジュアリー"],     video:{title:"シャネル5番の魅力｜なぜ100年愛されるのか",views:"145万",url:"#"} },
  // ネイル
  { id:25, cat:"ネイル",       sub:"ネイルカラー",    name:"ジェルカラー コレクション",      brand:"OPI",            price:1980,  rating:4.5, rev:12300, free:true,  desc:"300色以上の豊富なカラー。サロン級の発色と持ちを自宅で。",                  tags:["発色","長持ち","サロン仕上げ","バリエーション"],      video:{title:"OPIネイル神カラー2024｜流行りはこれ",views:"78万",url:"#"} },
  { id:26, cat:"ネイル",       sub:"ネイルケア",      name:"ネイルオイル ペン",              brand:"Uka",             price:2750,  rating:4.7, rev:6800,  free:true,  desc:"ロールオンタイプで持ち運びしやすい。爪・甘皮を集中保湿。",                  tags:["ネイルケア","保湿","持ち運び","甘皮ケア"],             video:{title:"爪の保湿ケア入門｜ネイルオイルの使い方",views:"34万",url:"#"} },
  { id:27, cat:"ネイル",       sub:"ネイルキット",    name:"ジェルネイルキット スターター",  brand:"Gelish",         price:12800, rating:4.6, rev:3200,  free:false, desc:"LEDライト付きの本格ジェルネイルキット。セルフで3〜4週間持続。",             tags:["ジェルネイル","セルフ","長持ち","初心者向け"],         video:{title:"セルフジェルネイル完全攻略｜初心者でもできる",views:"201万",url:"#"} },
  // サプリ
  { id:28, cat:"サプリ",       sub:"ビタミン",        name:"ビタミンC ハイポテンシー",       brand:"DHC",            price:980,   rating:4.5, rev:38200, free:true,  desc:"1粒1000mgの高濃度ビタミンC。美白・コラーゲン生成をサポート。",              tags:["美白","コラーゲン","プチプラ","毎日"],                video:{title:"ビタミンCサプリ選び方【美容専門家が解説】",views:"123万",url:"#"} },
  { id:29, cat:"サプリ",       sub:"コラーゲン",      name:"コラーゲン ドリンク プレミアム",  brand:"明治",           price:3240,  rating:4.3, rev:15600, free:true,  desc:"低分子コラーゲン10000mg配合。30日分の飲みやすいゼリータイプ。",             tags:["コラーゲン","ハリ","エイジングケア","飲みやすい"],    video:{title:"コラーゲンサプリ本当に効く？1ヶ月実験",views:"89万",url:"#"} },
  { id:30, cat:"サプリ",       sub:"抗酸化",          name:"グレープシードエキス複合体",     brand:"Ester-C",        price:4200,  rating:4.6, rev:5400,  free:false, desc:"抗酸化・紫外線ダメージ対策のトータルサポート。美容感度の高い人に。",        tags:["抗酸化","美白","紫外線対策","エイジングケア"],         video:{title:"美容皮膚科が飲んでるサプリTop5",views:"445万",url:"#"} },
];

export const ALL_TAGS = [...new Set(PRODUCTS.flatMap((p) => p.tags))];

export const CONCERNS = [
  "乾燥", "毛穴", "くすみ", "ニキビ", "赤み",
  "ダメージ毛", "うねり", "エイジング", "皮脂過多", "UV対策",
];
