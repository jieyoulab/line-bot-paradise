module.exports = function productCarousel(products) {
  return {
    type: 'carousel',
    contents: products.map((product, index) => {
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
                  text: `Top${index + 1}`, // 依照卡片順序遞增
                  weight: 'bold',
                  size: 'sm',
                  align: 'center',
                  color: '#FFFFFF'
                }
              ],
              backgroundColor: '#737e66',
              paddingAll: '4px'
            },
            { type: 'separator', color: '#eeeeee' }
          ]
        },
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            { type: 'image', url: image, size: 'full', aspectMode: 'cover', margin: 'md' },
            { type: 'text', text: name, weight: 'bold', size: 'lg', margin: 'md' },
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
                  color: '#ffffff'
                }
              ],
              backgroundColor: '#737e66',
              cornerRadius: '8px',
              paddingAll: '6px',
              action: { type: 'uri', label: '立即入手情人節飾品', uri: url }
            }
          ]
        }
      };
    })
  };
};
