/* Original Chinese study notes; source links are attached to each topic. */
const SOURCES = {
 atlas: ['加拿大自然资源部 · 地貌区', 'https://atlas.gc.ca/phys/en/index.html'],
 regions: ['加拿大政府 · 区域概览', 'https://www.canada.ca/en/immigration-refugees-citizenship/corporate/publications-manuals/discover-canada/read-online/canadas-regions.html'],
 bc: ['BC 皇家骑警 · 前后车牌', 'https://rcmp.ca/en/bc/mission/services-and-information/traffic-services/faqs'],
 ab: ['阿尔伯塔省 · 自然区域', 'https://www.alberta.ca/biodiversity-in-alberta'],
 abplate: ['阿尔伯塔省 · 车牌', 'https://www.alberta.ca/licence-plates'],
 sk: ['SGI · 萨省指路标志', 'https://sgi.sk.ca/handbook/-/knowledge_base/drivers/guide-signs'],
 mb: ['MPI · 曼省指路标志', 'https://apps.mpi.mb.ca/comms/drivershandbook/information-signs.html'],
 on: ['安省 · 森林地理分区', 'https://www.ontario.ca/document/forest-resources-ontario-2021/geographic-profiles'],
 qc: ['魁北克政府 · 交通标志', 'https://www.quebec.ca/en/transports/traffic-road-safety/traffic-signs-and-signals/traffic-signs/regulatory-signs'],
 speed: ['SAAQ · 魁北克驾驶常识', 'https://saaq.gouv.qc.ca/touristes-nouveaux-arrivants/particularites'],
 pei: ['爱德华王子岛省 · 红土', 'https://www.princeedwardisland.ca/en/information/executive-council-office/provincial-soil'],
 nl: ['纽芬兰省 · 生态区', 'https://www.gov.nl.ca/eccc/apa/eco/'],
 ns: ['新斯科舍省 · 自然景观', 'https://www.novascotia.ca/nse/protectedareas/docs/landscapes_report.pdf'],
 nt: ['西北地区政府 · 熊形车牌', 'https://www.gov.nt.ca/en/newsroom/souvenir-nwt-licence-plates-available-through-nwt-tourism'],
 nu: ['努纳武特政府 · 2025 新车牌', 'https://www.gov.nu.ca/en/newsroom/government-nunavut-unveils-new-polar-bear-licence-plate-design-2025-05-26'],
 plonk: ['Plonk It · 加拿大进阶图例', 'https://www.plonkit.net/canada'],
 map: ['地图边界 · Click That ’Hood / OpenStreetMap', 'https://github.com/codeforgermany/click_that_hood/blob/main/public/data/canada.geojson']
};
const REGIONS = [
 {id:'BC',en:'British Columbia',name:'不列颠哥伦比亚',group:'西部',tag:'海岸雨林 / 山地',capital:'维多利亚',color:'west',at:[-125,55],intro:'先分湿润海岸与干燥内陆。山地只是起点，植被和谷地往往更有用。',geo:['太平洋沿岸：湿润森林、海湾与陡峭山坡。','内陆谷地：可见较干的草坡、疏林与果园。','北部：森林公路与山地相间，不能只凭大树猜温哥华。'],clues:['普通汽车通常有前后两块车牌。','留意省名、公路编号及沿途城镇，建立海岸与内陆的区分。'],trap:'落基山脉跨越 BC 与 AB；看到雪山不能直接定省。',compare:'AB',places:[['海岸 · Squamish',49.7016,-123.1558],['内陆 · Kamloops',50.6745,-120.3273]],sources:['atlas','bc']},
 {id:'AB',en:'Alberta',name:'阿尔伯塔',group:'西部',tag:'落基山 / 草原',capital:'埃德蒙顿',color:'west',at:[-115,55],intro:'同一省可以从高山切换到草原，再向北进入针叶林。先判断自己处在哪条自然带。',geo:['西部：落基山与山麓，地势起伏明显。','南部：开阔草原、农牧地与部分恶地地貌。','北部：广阔北方森林，不是全省都干燥平坦。'],clues:['普通汽车使用后车牌；前方没牌只能作辅助。','公路两侧的牧场、能源设施与格网道路要结合地形判断。'],trap:'AB 与 SK 南部草原相似；油井和麦田都不能单独定省。',compare:'SK',places:[['山地 · Banff',51.1784,-115.5708],['草原 · Medicine Hat',50.0405,-110.6765]],sources:['ab','abplate']},
 {id:'SK',en:'Saskatchewan',name:'萨斯喀彻温',group:'草原',tag:'格网农田 / 北方森林',capital:'里贾纳',color:'prairie',at:[-106,55],intro:'南部的开阔感很醒目，但不要把“萨省”记成一张没有树的平原。',geo:['南部：大片农田与草原，地平线开阔。','中部：农田与林地过渡。','北部：湖泊、森林与地盾地貌。'],clues:['优先识别省级公路路盾，再读取编号。','直线乡间道路与规则交叉口只提示草原地带。'],trap:'平坦农田也可能在 AB、MB，甚至安省南部。',compare:'MB',places:[['南部 · Regina',50.4452,-104.6189],['过渡带 · Prince Albert',53.2033,-105.7531]],sources:['atlas','sk']},
 {id:'MB',en:'Manitoba',name:'曼尼托巴',group:'草原',tag:'草原东缘 / 湖泊',capital:'温尼伯',color:'prairie',at:[-98,56],intro:'连接大草原与加拿大地盾。南部农田和东部岩石森林可以呈现截然不同的街景。',geo:['南部：平坦农田与温尼伯周边聚落。','东部：地盾岩石、森林与湖泊。','北部：森林逐渐过渡到哈德逊湾沿岸低地。'],clues:['学习 MANITOBA 路盾及 PTH 与 Provincial Road 的区别。','定位时把湖泊、岩石和路号一起使用。'],trap:'只看农田容易混淆 SK；只看岩石森林容易混淆 ON。',compare:'ON',places:[['南部 · Winnipeg',49.8951,-97.1384],['东部 · West Hawk Lake',49.7606,-95.1925]],sources:['atlas','mb']},
 {id:'ON',en:'Ontario',name:'安大略',group:'中部',tag:'五大湖 / 加拿大地盾',capital:'多伦多',color:'central',at:[-85,51],intro:'南北差别比省界更值得先学：南部是密集农田与城市，北部常见森林、湖泊和岩石切坡。',geo:['南部：五大湖周边农田、城市与交通走廊。','中北部：地盾岩石、湖泊与针阔混交林。','更北部：进入哈德逊湾低地，不能全用岩石判断。'],clues:['在官方路号与城镇名之间交叉核对。','道路切坡露出的基岩提示地盾，不能独占指向安省。'],trap:'魁北克和曼省东部也有类似地盾森林。',compare:'QC',places:[['南部 · London',42.9849,-81.2453],['地盾 · Parry Sound',45.3474,-80.0353]],sources:['on','atlas']},
 {id:'QC',en:'Quebec',name:'魁北克',group:'中部',tag:'法语 / 圣劳伦斯河',capital:'魁北克城',color:'central',at:[-71,54],intro:'法语是很有价值的起点，接着用河谷、城市与地盾地形缩小区域。',geo:['南部：圣劳伦斯河谷的聚落与农田。','北部：森林、湖泊及地盾地形。','东部：加斯佩半岛等地可见山地海岸。'],clues:['ARRÊT 八角停车牌是重要线索；结合其他法语标牌。','把 rue、chemin、rang 等路名词与具体地名一起读。'],trap:'加拿大其他法语社区也可能出现法语或双语标牌。',compare:'NB',places:[['河谷 · Trois-Rivières',46.3432,-72.5433],['半岛 · Gaspé',48.8316,-64.4869]],sources:['qc','regions','atlas']},
 {id:'NB',en:'New Brunswick',name:'新不伦瑞克',group:'大西洋',tag:'双语 / 林地丘陵',capital:'弗雷德里克顿',color:'atlantic',at:[-66.5,46.5],intro:'英语与法语都值得留意。先将它放进大西洋区域，再寻找文字和道路信息。',geo:['内陆：林地、河谷与丘陵。','海岸：沿圣劳伦斯湾及芬迪湾展开。','聚落语言因地区而异，不要用一个标牌覆盖全省。'],clues:['双语信息有帮助，但不是该省独有。','看到 Moncton、Fredericton、Saint John 时优先定位。'],trap:'Saint John 在 NB；St. John’s 在 NL，别把两者混为一城。',compare:'QC',places:[['内陆 · Fredericton',45.9636,-66.6431],['东部 · Moncton',46.0878,-64.7782]],sources:['regions','atlas']},
 {id:'NS',en:'Nova Scotia',name:'新斯科舍',group:'大西洋',tag:'半岛 / 海湾丘陵',capital:'哈利法克斯',color:'atlantic',at:[-63.5,45],intro:'海岸线曲折的半岛，林地与海湾常交替出现。布雷顿角的起伏可比想象中大。',geo:['半岛：林地丘陵、海湾和沿岸聚落。','布雷顿角：局部高地与陡峭海岸。','内陆也有大量森林，海景不是必备条件。'],clues:['重点记 Halifax、Truro、Sydney 等地名。','把海湾走向和路号作为定位证据。'],trap:'海边木屋不是 NS 专属，NB 与 NL 也很常见。',compare:'NL',places:[['半岛 · Lunenburg',44.377,-64.3188],['布雷顿角 · Ingonish',46.6918,-60.3672]],sources:['ns','regions']},
 {id:'PE',en:'Prince Edward Island',name:'爱德华王子岛',group:'大西洋',tag:'红土 / 起伏农田',capital:'夏洛特敦',color:'atlantic',at:[-63.1,46.5],intro:'红土与缓和起伏的农田是最值得先建立的视觉组合。',geo:['农业景观与缓坡交织。','裸露土壤常带红色，来自富含氧化铁的母质。','海岸可见红色砂岩，但并非每一处路边都露出红土。'],clues:['红土 + 农田 + 海岛聚落比单看土色更有用。','留意 Charlottetown、Summerside 等地名。'],trap:'其他地方也可能有红土，色温与季节也会影响画面。',compare:'NB',places:[['农田 · New Glasgow',46.408,-63.347],['城镇 · Charlottetown',46.2382,-63.1311]],sources:['pei','regions']},
 {id:'NL',en:'Newfoundland and Labrador',name:'纽芬兰与拉布拉多',group:'大西洋',tag:'岩岸 / 北方植被',capital:'圣约翰斯',color:'atlantic',at:[-59,54],intro:'先分纽芬兰岛与大陆上的拉布拉多。海岸裸岩和低矮植被很有用，但不是全省通用。',geo:['纽芬兰岛：海岸、森林与荒原相间。','拉布拉多：大陆北方森林与北部苔原。','局部迎风海岸树木低矮，内陆仍可有密林。'],clues:['St. John’s 指纽芬兰岛；不要误认 NB 的 Saint John。','结合路号、海岸和聚落名区分岛屿与大陆。'],trap:'“没树、海风大”只能缩小区域，不能排除其他北方海岸。',compare:'NS',places:[['岛屿 · St. John’s',47.5615,-52.7126],['大陆 · Happy Valley-Goose Bay',53.3017,-60.3261]],sources:['nl','atlas']},
 {id:'YT',en:'Yukon Territory',name:'育空',group:'北方',tag:'山地 / 北方公路',capital:'白马市',color:'north',at:[-135,65],intro:'北方山地与宽阔谷地构成重要背景。与 BC 北部比较时，优先找公路信息。',geo:['大部分地区有显著山地。','河谷与森林公路是重要观察场景。','北部进入更寒冷、植被低矮的环境。'],clues:['Whitehorse、Dawson 与 Alaska Highway 是实用地名线索。','稀疏聚落和长距离路牌需与路号一起看。'],trap:'长直公路、矮针叶林不能把 YT 与 NT 自动分开。',compare:'NT',places:[['南部 · Whitehorse',60.7212,-135.0568],['内陆 · Dawson City',64.0601,-139.4332]],sources:['atlas','regions']},
 {id:'NT',en:'Northwest Territories',name:'西北地区',group:'北方',tag:'大湖 / 北方森林',capital:'耶洛奈夫',color:'north',at:[-119,65],intro:'从西部山地、麦肯齐河流域到东部地盾，地形并不单一。',geo:['西部有山地，部分地区较平坦。','森林、湖泊与地盾裸岩都是候选特征。','越过林线后可出现苔原环境。'],clues:['熊形车牌很醒目，但还需读牌面地区文字。','Yellowknife、Hay River 与 Inuvik 是关键地名。'],trap:'努纳武特在 2025 年重推熊形牌；旧街景和新牌应分别判断。',compare:'NU',places:[['大湖 · Yellowknife',62.454,-114.3718],['北部 · Inuvik',68.3607,-133.723]],sources:['nt','nu','atlas']},
 {id:'NU',en:'Nunavut',name:'努纳武特',group:'北方',tag:'苔原 / 北极聚落',capital:'伊魁特',color:'north',at:[-91,68],intro:'北极环境与分散聚落是学习重点，不能用“无树”一条就直接定地区。',geo:['大范围苔原与北极群岛。','城镇之间没有贯通全地区的公路网络。','街景覆盖、拍摄时间与题库会影响实际出题场景。'],clues:['地区文字、Iqaluit 等地名比单一植被更可靠。','2025 年官方重新推出熊形车牌，注意影像年代。'],trap:'北部 NT、YT 或拉布拉多也有无树景观。',compare:'NT',places:[['聚落 · Iqaluit',63.7467,-68.517],['聚落 · Cambridge Bay',69.1169,-105.0597]],sources:['nu','atlas','regions']}
];
const CLUES = [
 {id:'stop',title:'ARRÊT 停车牌',category:'语言路牌',strength:'较强',regions:['QC','NB'],visual:'stop',summary:'看到法语停车牌，先把魁北克放进候选。',detail:'连续的法语道路与商业标牌比单个 ARRÊT 更有力。其他法语社区和双语地区也可能出现法语；继续寻找省名与地名。',sources:['qc']},
 {id:'speed',title:'公里制与限速牌',category:'语言路牌',strength:'辅助',regions:[],visual:'speed',summary:'加拿大限速使用 km/h，适合先做国家级判断。',detail:'SAAQ 明确指出加拿大限速以公里每小时表示。仅见数字 80 或黄色中线不能排除美国；要看单位、牌面文字、路号与其他证据。',sources:['speed']},
 {id:'front',title:'前车牌：看组合',category:'车辆设施',strength:'辅助',regions:['BC','AB'],visual:'plate',summary:'BC 普通汽车通常前后挂牌；AB 普通汽车仅后挂牌。',detail:'车辆可能跨省旅行，摩托车、特殊车辆也有例外。连续观察多辆普通汽车，比单看一辆更有参考价值；看不清不等于没有牌。',sources:['bc','abplate']},
 {id:'bear',title:'熊形车牌的例外',category:'车辆设施',strength:'较强',regions:['NT','NU'],visual:'bear',summary:'西北地区与努纳武特都要考虑，读文字再判断。',detail:'NT 有标志性的熊形车牌。NU 于 2025 年重新推出熊形设计，旧街景仍可能出现此前的矩形牌。轮廓不能唯一定位；牌面地区名称更可靠。',sources:['nt','nu']},
 {id:'soil',title:'红土与海岛农田',category:'自然地理',strength:'组合',regions:['PE'],visual:'soil',summary:'爱德华王子岛：红土、农田、缓坡一起记。',detail:'当地 Charlottetown 土壤的红色来自氧化铁。雨水、阴影和相机色温会改变颜色；红土不是全球或加拿大范围内的唯一线索。',sources:['pei']},
 {id:'shield',title:'裸岩、湖泊与针叶林',category:'自然地理',strength:'组合',regions:['ON','QC','MB','NT','NL'],visual:'rock',summary:'先认加拿大地盾，再用文字与公路信息分省。',detail:'地盾横跨多个省与地区，路边岩石切坡只是地貌线索。不要把一张森林裸岩照片自动归到安大略。',sources:['atlas','on']},
 {id:'prairie',title:'格网道路与开阔农田',category:'自然地理',strength:'组合',regions:['AB','SK','MB'],visual:'prairie',summary:'先缩到草原区域，再找省级路盾和地名。',detail:'南部草原常见长直道路与开阔农业景观，但北部景观会转为森林。地势平坦本身无法区分 AB、SK、MB。',sources:['ab','atlas']},
 {id:'route',title:'路盾优先于风景',category:'语言路牌',strength:'较强',regions:['SK','MB'],visual:'route',summary:'看到省名与公路编号，先读牌，再看风景。',detail:'省级道路标志有各自的体系。先用 SGI 与 MPI 官方图例学习 Saskatchewan 和 Manitoba 的标志，再到街景找实例；相同数字可能出现在不同省。',sources:['sk','mb']},
 {id:'mountain',title:'山地不等于 BC',category:'自然地理',strength:'辅助',regions:['BC','AB','YT'],visual:'mountain',summary:'山形、湿度、植被与路号需要一起使用。',detail:'加拿大西部山地跨省分布。AB 西部也有落基山，YT 也有显著山地。BC 内陆可能干燥，不能把整省记成海岸雨林。',sources:['atlas','ab']},
 {id:'camera',title:'相机与覆盖 Meta',category:'拍摄覆盖',strength:'辅助',regions:[],visual:'camera',summary:'影像年代与覆盖会更新，不用相机代际硬锁省。',detail:'看得到的车身、画质、季节和相机差异可以辅助复盘，但这份手册不把未验证的独家车 meta 当作规则。先用道路、语言和地貌建立判断，再对照进阶社区图例及具体街景日期。',sources:['plonk']}
];
CLUES.push(
 {id:'bilingual',title:'双语公路牌：读完整名称',category:'语言路牌',strength:'组合',regions:['NB'],visual:'route',photoId:'nb-bilingual',summary:'同一块牌上有英法两种语言，继续寻找可定位的道路名。',detail:'实拍的 Veterans Memorial Highway / Autoroute des anciens combattants 位于 NB。双语本身不是独占线索；完整道路名、城镇与路线才更有定位价值。',sources:['regions']},
 {id:'destination',title:'路牌上的目的地不等于所在地',category:'语言路牌',strength:'较强',regions:['MB','ON'],visual:'route',photoId:'mb-road',summary:'在曼省公路上，也可能看见通向安省 Kenora 的路牌。',detail:'照片牌面写有 Falcon Lake 125、Kenora 191。把方向、距离和公路体系一起读，避免看到邻省城市就直接把落点放到该省。',sources:['mb']},
 {id:'stairs',title:'外楼梯与连续街屋',category:'建筑人文',strength:'辅助',regions:['QC'],visual:'camera',photoId:'qc-stairs',summary:'蒙特利尔 Plateau 实拍：看上层入口与外楼梯。',detail:'将楼梯、联排立面、门窗与路边停车分别观察，再找法语街牌与具体地名。建筑风格只帮助建立候选，不能直接代表整省。',sources:['regions']},
 {id:'grain',title:'谷仓与农业生产设施',category:'建筑人文',strength:'组合',regions:['SK','AB','MB'],visual:'prairie',photoId:'sk-grain',summary:'从生产设施判断土地用途，再结合农田与道路格局。',detail:'示例是 Moose Jaw 附近农场的储粮设施。类似建筑跨省和跨国存在，别把谷仓本身当作萨省独有标志。',sources:['regions']},
 {id:'woodhouses',title:'彩色房屋与大西洋聚落',category:'建筑人文',strength:'辅助',regions:['NS','NL','NB'],visual:'camera',photoId:'ns-town',summary:'颜色容易记住，但街区尺度、立面与地名更值得读。',detail:'实拍来自 Lunenburg；不同大西洋聚落也可能出现类似彩色建筑。先观察屋顶、外墙和道路坡度，再寻找街名与城镇名。',sources:['ns','regions']},
 {id:'southfarm',title:'农田并不只在草原三省',category:'自然地理',strength:'辅助',regions:['ON','AB','SK','MB'],visual:'prairie',photoId:'on-farm',summary:'南部安大略的农田可修正“农田＝大草原”的直觉。',detail:'照片中的农田、树带与田间通道说明当地土地使用方式，却不足以唯一定位。把自然带、路网和路牌交叉核对。',sources:['on','regions']},
 {id:'northroad',title:'北方公路：路面、植被与山体',category:'自然地理',strength:'组合',regions:['YT','NT'],visual:'mountain',photoId:'yt-road',summary:'Dempster Highway 的具体路段，需要继续用地名确认。',detail:'Tombstone 区域实拍同时呈现道路、低矮植被与山地。公路本身跨越 YT 与 NT；认出公路名并不意味着已经确定地区。',sources:['atlas']}
);
const cluePhotos={stop:'qc-stop',soil:'pei-road',shield:'on-shield',prairie:'sk-road',route:'mb-road',mountain:'ab-mountain'};
CLUES.forEach(c=>{if(cluePhotos[c.id])c.photoId=cluePhotos[c.id]});
const QUESTIONS = [
 {q:'看到一块 ARRÊT 停车牌，最合理的下一步是？',options:['直接锁定魁北克','把魁北克列为候选，继续检查语言与地名','排除所有英语省份','直接选择新不伦瑞克'],answer:1,why:'法语停车牌是有价值的线索，但其他法语社区也可能出现。连续的法语信息与地名更可靠。',clue:'stop'},
 {q:'熊形车牌轮廓清楚，但地区文字模糊。应如何判断？',options:['唯一可能是西北地区','唯一可能是努纳武特','保留西北地区与努纳武特，核对文字及影像年代','一定是旅游纪念品'],answer:2,why:'努纳武特在 2025 年重新推出熊形牌，熊形并不唯一指向 NT。',clue:'bear'},
 {q:'红色裸土、缓坡农田与海岛聚落组合，优先考虑？',options:['爱德华王子岛','育空','西北地区','阿尔伯塔北部'],answer:0,why:'PEI 的红土有明确的地质依据，配合农田和海岛景观有参考价值。土色本身仍非唯一证据。',clue:'soil'},
 {q:'路旁裸岩、湖泊和针叶林很多，能直接确定安大略吗？',options:['能，地盾只在安省','不能，地盾跨越多个省和地区','能，魁北克没有针叶林','不能，只可能是 BC'],answer:1,why:'加拿大地盾分布很广，还需读路号、地名和语言。',clue:'shield'},
 {q:'开阔农田与长直格网道路，最适合先缩小到哪组？',options:['NS / PE / NL','YT / NT / NU','AB / SK / MB','BC / NU / QC'],answer:2,why:'这是南部草原常见的景观组合，继续用省级路盾区分。',clue:'prairie'},
 {q:'看到落基山风景，应优先保留哪两个省？',options:['AB 与 BC','ON 与 QC','NB 与 PE','MB 与 NS'],answer:0,why:'落基山跨越 AB 与 BC，不能只凭雪山定 BC。',clue:'mountain'},
 {q:'普通汽车有清晰前车牌，对 BC 与 AB 的判断有何帮助？',options:['可以直接排除 AB','BC 得到一定支持，但要防跨省车辆','能直接定位温哥华','毫无参考价值'],answer:1,why:'BC 普通车通常前后挂牌，AB 通常仅后牌，但旅行车辆与特殊类别都可能影响判断。',clue:'front'},
 {q:'安大略南部与中北部，哪种区分更合理？',options:['南部全是苔原，北部全是农田','南部常见农田城市；中北部常见地盾森林湖泊','南北没有明显区别','只要有湖就一定在北部'],answer:1,why:'同一省内部的地理变化很大，南北自然带比单一省级印象更有用。',clue:'shield'},
 {q:'Saint John 与 St. John’s 分别对应？',options:['都在魁北克','前者 NB，后者 NL','前者 NL，后者 NB','都在新斯科舍'],answer:1,why:'Saint John 位于新不伦瑞克；St. John’s 是纽芬兰与拉布拉多省首府。',clue:'route'},
 {q:'加拿大限速数字旁清楚标出 km/h，能说明什么？',options:['这一定是美国','支持加拿大判断，但还需其他线索','可以直接定位某省','所有北美国家都不用公里制'],answer:1,why:'公里制有助于区分加拿大与美国街景，但不能单独确定省份。',clue:'speed'},
 {q:'BC 的内陆出现干燥草坡，是否矛盾？',options:['矛盾，BC 全省是雨林','不矛盾，海岸与内陆有明显差异','矛盾，只可能是萨省','矛盾，只可能是美国'],answer:1,why:'海岸湿润的印象不能套到整个 BC，内陆谷地可更干燥。',clue:'mountain'},
 {q:'一张无树、植被低矮的街景，能唯一指向努纳武特吗？',options:['能，无树就是 NU','不能，其他北方地区也有类似景观','能，NT 全部是森林','不能，只可能是 PEI'],answer:1,why:'苔原分布跨行政区，需结合地区文字、聚落名和具体覆盖。',clue:'camera'}
];
