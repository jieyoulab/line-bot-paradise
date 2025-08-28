module.exports = function productCard(product) {
  // name, image, specs 從 JSON 或抓取的資料取得
  const name = product.name;
  const image = product.image;
  const specs = product.specs || (product.desc ? [{ specName: '', specPrice: product.desc, specLink: product.url || '#' }] : []);
  const url = product.url || '#';

  return {
    type: 'bubble',
    header: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '0px',
      contents: [
        {
          type: 'box',
          layout: 'baseline',
          justifyContent: 'center',
          paddingTop: '6px',
          paddingBottom: '6px',
          contents: [
            {
              type: 'text',
              text: 'Top1',
              weight: 'bold',
              size: 'sm',
              align: 'center',
              color: '#FFFFFF'
            }
          ],
          backgroundColor: '#f768a4',
        },
        {
          type: 'separator',
          color: '#eeeeee'
        }
      ]
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'image',
          url: image,
          size: 'full',
          aspectMode: 'cover',
          margin: 'md'
        },
        {
          type: 'text',
          text: name,
          weight: 'bold',
          size: 'lg',
          margin: 'md'
        },
        ...specs.map(s => ({
          type: 'text',
          text: s.specName ? `${s.specName}: ${s.specPrice}` : s.specPrice,
          color: '#666666',
          size: 'sm',
          wrap: true,
          margin: 'sm'
        })),
        {
          type: 'box',
          layout: 'vertical',
          margin: 'md',
          contents: [
            {
              type: 'text',
              text: '立即入手',
              align: 'center',
              weight: 'bold',
              size: 'sm',          // 小一點字
              color: '#ffffff'
            }
          ],
          backgroundColor: '#f768a4',
          cornerRadius: '8px',
          paddingAll: '6px',       // 控制高度 (縮小 padding)
          action: {
            type: 'uri',
            label: '立即入手',
            uri: url
          }
        }
      ]
    }
  };
};
