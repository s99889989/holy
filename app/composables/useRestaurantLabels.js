// composables/useRestaurantLabels.js

export const labelSections = [
  {
    key: 'sauce',
    label: '醬料',
    items: [
      { zh: '胡麻醬', tag: '葷', en: 'Sesame Dressing', enTag: 'Non-Veg' },
      { zh: '油醋醬', tag: '素', en: 'Vinaigrette', enTag: 'Vegan' },
      { zh: '洋蔥鮪魚', tag: '葷', en: 'Tuna with Onions', enTag: 'Non-Veg' },
      { zh: '黑芝麻醬', tag: '素', en: 'Black Sesame Paste', enTag: 'Vegan' },
      { zh: '醬油膏', tag: '', en: 'Thick Soy Sauce', enTag: '' },
      { zh: '辣椒醬油', tag: '非常辣', en: 'Chili Soy Sauce', enTag: 'Spicy', tagColor: 'red' },
      { zh: '自製沾醬', tag: '葷', en: 'House-made Dipping Sauce', enTag: 'Non-Veg' },
      { zh: '自製沾醬', tag: '素', en: 'House-made Dipping Sauce', enTag: 'Vegan' },
      { zh: '和風柚子', tag: '素', en: 'Japanese Yuzu Dressing', enTag: 'Vegan' },
      { zh: '蜂蜜', tag: '', en: 'Honey', enTag: '' },
      { zh: '和風芝麻', tag: '素', en: 'Japanese Sesame Dressing', enTag: 'Vegan' },
      { zh: '火龍果醬', tag: '素', en: 'Dragon Fruit Jam', enTag: 'Vegan' },
      { zh: '蔓越莓腰果', tag: '素', en: 'Cranberry Cashews', enTag: 'Vegan' },
      { zh: '鳳梨腰果', tag: '素', en: 'Pineapple Cashews', enTag: 'Vegan' },
      { zh: '腰果醬', tag: '素', en: 'Cashew Paste', enTag: 'Vegan' },
    ]
  },
  {
    key: 'drink',
    label: '飲品',
    items: [
      { zh: '紅烏龍茶', tag: '', en: 'Red Oolong Tea', enTag: '' },
      { zh: '青茶', tag: '', en: 'Light Oolong Tea', enTag: '' },
      { zh: '白鶴靈芝', tag: '', en: 'White Crane Lingzhi Tea', enTag: '' },
      { zh: '芳香萬壽菊', tag: '', en: 'Lemon Marigold Tea', enTag: '' },
      { zh: '七葉蘭', tag: '', en: 'Pandan Leaf Tea', enTag: '' },
      { zh: '檸檬香茅', tag: '', en: 'Lemongrass Tea', enTag: '' },
      { zh: '鳳梨鼠尾草', tag: '', en: 'Pineapple Sage Tea', enTag: '' },
      { zh: '魚腥草', tag: '', en: 'Houttuynia Tea', enTag: '' },
      { zh: '三葉五加', tag: '', en: 'Three-leaf Eleuthero', enTag: '' },
      { zh: '扁桃斑鳩菊', tag: '', en: 'African Bitter Leaf Tea', enTag: '' },
      { zh: '紫蘇', tag: '', en: 'Perilla', enTag: '' },
      { zh: '現磨濃豆漿', tag: '', en: 'Freshly Ground Rich Soy Milk', enTag: '' },
      { zh: '黑糖薑茶', tag: '', en: 'Brown Sugar Ginger Tea', enTag: '' },
      { zh: '黑糖南薑茶', tag: '', en: 'Brown Sugar Galangal Tea', enTag: '' },
      { zh: '好體力茶', tag: '', en: 'Energy Boost Tea', enTag: '' },
      { zh: '好輕鬆茶', tag: '', en: 'Relax & Unwind Tea', enTag: '' },
      { zh: '好睡茶', tag: '', en: 'Sleepy Time Tea', enTag: '' },
      { zh: '幸福茶', tag: '', en: 'Happiness Blend Tea', enTag: '' },
      { zh: '舒康茶', tag: '', en: 'Wellness & Comfort Tea', enTag: '' },
      { zh: '添加甜菊', tag: '天然微甜', en: 'Stevia Added', enTag: 'Naturally Sweetened' },
      { zh: '冬瓜糖水', tag: '', en: 'Winter Melon Sugar Syrup', enTag: '' },
    ]
  },
  {
    key: 'food',
    label: '食品',
    items: [
      { zh: '手工餅乾', tag: '', en: 'Handmade Cookies', enTag: '' },
      { zh: '手工麵包', tag: '', en: 'House-baked Bread', enTag: '' },
      { zh: '素肉燥', tag: '', en: 'Vegetarian Meat Sauce', enTag: '' },
      { zh: '自製芝麻湯圓', tag: '', en: 'House-made Sesame Tangyuan', enTag: '' },
      { zh: '田間自產', tag: '', en: 'Farm-to-Table Fresh', enTag: '' },
      { zh: '（含有堅果類）', tag: '', en: '(Contains Nuts)', enTag: '' },
      { zh: '冷飲', tag: '', en: 'Chilled', enTag: '' },
      { zh: '溫飲', tag: '', en: 'Warm', enTag: '' },
      { zh: '辣', tag: '', en: 'Spicy', enTag: '' },
      { zh: '不辣', tag: '', en: 'Not Spicy', enTag: '' },
    ]
  },
  {
    key: 'diet',
    label: '飲食分類',
    items: [
      { zh: '葷食', tag: '', en: 'Non-Veg', enTag: '' },
      { zh: '素食', tag: '', en: 'Vegan', enTag: '' },
      { zh: '五辛素', tag: '', en: 'Vegetarian (contains Allium)', enTag: '' },
      { zh: '蛋奶素', tag: '', en: 'Ovo-Lacto Vegetarian', enTag: '' },
      { zh: '五辛蛋奶素', tag: '', en: 'Ovo-Lacto Vegetarian (contains Allium)', enTag: '' },
    ]
  },
]

export const allLabels = labelSections.flatMap(s => s.items)
