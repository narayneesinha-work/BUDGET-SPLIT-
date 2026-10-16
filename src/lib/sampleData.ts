import { InputFormData } from '../types';

export const SAMPLE_DATASET: InputFormData = {
  brandName: 'Zephyr',
  brandVariants: 'Zefer, Zephir, Zephyr Athletics, Zephyr Apparel',
  competitors: 'Zara, H&M, UrbanThread, Gymshark, Lululemon',
  seedKeywords: `oversized t-shirt
vintage graphic tee
heavyweight cotton t-shirt
acid wash streetwear tee
zephyr drop shoulder tee
zefer black gym shirt
zephyr athletic pump cover
zara oversized tee alternative
gymshark seamless t-shirt
urbanthread relaxed fit tee
free t-shirt giveaway
zephyr careers clothing job`,
  expandedKeywords: `oversized fit streetwear shirt	14,800	High	$1.85	$3.40
men boxy fit heavyweight tee	9,200	Medium	$1.20	$2.45
vintage washed oversized tee	6,400	High	$2.15	$4.10
drop shoulder streetwear t-shirt	7,100	Medium	$1.60	$3.00
heavyweight 280gsm cotton shirt	4,500	High	$2.50	$4.80
acid wash retro graphic tee	5,800	Medium	$1.90	$3.25
zephyr heavyweight pump cover	1,400	Low	$0.85	$1.60
zephyr vintage wash t-shirt	2,100	Low	$0.90	$1.75
h&m relaxed crew neck tee	18,200	High	$0.75	$1.50
gymshark oversized workout shirt	22,000	High	$1.40	$2.90
wholesale bulk blank t-shirts	8,900	Low	$0.35	$0.80
t-shirt manufacturer jobs salary	1,200	Low	$0.15	$0.40`,
  globalNegatives: 'free, jobs, careers, wholesale, salary, internship, coupon, torrent, pdf, login',
  provider: 'gemini',
  model: 'gemini-3.8-flash',
  apiKey: '',
};
