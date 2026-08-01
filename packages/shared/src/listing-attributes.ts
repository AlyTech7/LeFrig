import { z } from 'zod';

export type AttributeFieldType = 'text' | 'number' | 'select';

export type AttributeFieldOption = {
  value: string;
  labelEs: string;
  labelAr: string;
};

export type AttributeFieldDef = {
  key: string;
  labelEs: string;
  labelAr: string;
  type: AttributeFieldType;
  required?: boolean;
  placeholder?: string;
  options?: AttributeFieldOption[];
  min?: number;
  max?: number;
};

export type ListingAttributeSchema = {
  id: string;
  categorySlugs: string[];
  fields: AttributeFieldDef[];
  /** Descripción libre más corta cuando hay campos estructurados */
  descriptionMinLength: number;
};

const CAR_BRANDS: AttributeFieldOption[] = [
  { value: 'toyota', labelEs: 'Toyota', labelAr: 'تويوتا' },
  { value: 'renault', labelEs: 'Renault', labelAr: 'رينو' },
  { value: 'peugeot', labelEs: 'Peugeot', labelAr: 'بيجو' },
  { value: 'citroen', labelEs: 'Citroën', labelAr: 'سيتروين' },
  { value: 'dacia', labelEs: 'Dacia', labelAr: 'داسيا' },
  { value: 'volkswagen', labelEs: 'Volkswagen', labelAr: 'فولكسفاغن' },
  { value: 'seat', labelEs: 'Seat', labelAr: 'سيات' },
  { value: 'skoda', labelEs: 'Škoda', labelAr: 'سكودا' },
  { value: 'opel', labelEs: 'Opel', labelAr: 'أوبل' },
  { value: 'fiat', labelEs: 'Fiat', labelAr: 'فيات' },
  { value: 'hyundai', labelEs: 'Hyundai', labelAr: 'هيونداي' },
  { value: 'kia', labelEs: 'Kia', labelAr: 'كيا' },
  { value: 'nissan', labelEs: 'Nissan', labelAr: 'نيسان' },
  { value: 'mitsubishi', labelEs: 'Mitsubishi', labelAr: 'ميتسوبيشي' },
  { value: 'suzuki', labelEs: 'Suzuki', labelAr: 'سوزوكي' },
  { value: 'honda', labelEs: 'Honda', labelAr: 'هوندا' },
  { value: 'mazda', labelEs: 'Mazda', labelAr: 'مازدا' },
  { value: 'ford', labelEs: 'Ford', labelAr: 'فورد' },
  { value: 'chevrolet', labelEs: 'Chevrolet', labelAr: 'شيفروليه' },
  { value: 'isuzu', labelEs: 'Isuzu', labelAr: 'إيسوزو' },
  { value: 'mercedes', labelEs: 'Mercedes-Benz', labelAr: 'مرسيدس' },
  { value: 'bmw', labelEs: 'BMW', labelAr: 'BMW' },
  { value: 'audi', labelEs: 'Audi', labelAr: 'أودي' },
  { value: 'volvo', labelEs: 'Volvo', labelAr: 'فولفو' },
  { value: 'jeep', labelEs: 'Jeep', labelAr: 'جيب' },
  { value: 'land_rover', labelEs: 'Land Rover', labelAr: 'لاند روفر' },
  { value: 'mini', labelEs: 'Mini', labelAr: 'ميني' },
  { value: 'porsche', labelEs: 'Porsche', labelAr: 'بورش' },
  { value: 'cupra', labelEs: 'Cupra', labelAr: 'كوبرا' },
  { value: 'byd', labelEs: 'BYD', labelAr: 'بي واي دي' },
  { value: 'mg', labelEs: 'MG', labelAr: 'إم جي' },
  { value: 'geely', labelEs: 'Geely', labelAr: 'جيلي' },
  { value: 'chery', labelEs: 'Chery', labelAr: 'شيري' },
  { value: 'changan', labelEs: 'Changan', labelAr: 'شانجان' },
  { value: 'haval', labelEs: 'Haval', labelAr: 'هافال' },
  { value: 'great_wall', labelEs: 'Great Wall', labelAr: 'جريت وول' },
  { value: 'jac', labelEs: 'JAC', labelAr: 'جاك' },
  { value: 'gac', labelEs: 'GAC', labelAr: 'جي إيه سي' },
  { value: 'tesla', labelEs: 'Tesla', labelAr: 'تيسلا' },
  { value: 'other', labelEs: 'Otra marca', labelAr: 'ماركة أخرى' },
];

const BODY_TYPE_OPTIONS: AttributeFieldOption[] = [
  { value: 'sedan', labelEs: 'Berlina / sedán', labelAr: 'سيدان' },
  { value: 'hatchback', labelEs: 'Compacto / hatchback', labelAr: 'هاتشباك' },
  { value: 'suv', labelEs: 'SUV / crossover', labelAr: 'دفع رباعي' },
  { value: '4x4', labelEs: 'Todoterreno 4x4', labelAr: '4x4' },
  { value: 'pickup', labelEs: 'Pickup', labelAr: 'بيك أب' },
  { value: 'van', labelEs: 'Furgoneta / van', labelAr: 'شاحنة صغيرة' },
  { value: 'minibus', labelEs: 'Minibús', labelAr: 'حافلة صغيرة' },
  { value: 'coupe', labelEs: 'Coupé', labelAr: 'كوبيه' },
  { value: 'wagon', labelEs: 'Familiar / break', labelAr: 'ستيشن' },
  { value: 'convertible', labelEs: 'Descapotable', labelAr: 'مكشوف' },
  { value: 'other', labelEs: 'Otro', labelAr: 'آخر' },
];

const DOORS_OPTIONS: AttributeFieldOption[] = [
  { value: '2', labelEs: '2 puertas', labelAr: 'بابان' },
  { value: '3', labelEs: '3 puertas', labelAr: '3 أبواب' },
  { value: '4', labelEs: '4 puertas', labelAr: '4 أبواب' },
  { value: '5', labelEs: '5 puertas', labelAr: '5 أبواب' },
];

const FUEL_OPTIONS: AttributeFieldOption[] = [
  { value: 'petrol', labelEs: 'Gasolina', labelAr: 'بنزين' },
  { value: 'diesel', labelEs: 'Diésel', labelAr: 'ديزل' },
  { value: 'hybrid', labelEs: 'Híbrido', labelAr: 'هجين' },
  { value: 'plugin_hybrid', labelEs: 'Híbrido enchufable', labelAr: 'هجين قابل للشحن' },
  { value: 'electric', labelEs: 'Eléctrico', labelAr: 'كهربائي' },
  { value: 'lpg', labelEs: 'GLP / gas', labelAr: 'غاز' },
  { value: 'cng', labelEs: 'GNC', labelAr: 'غاز طبيعي' },
];

const TRANSMISSION_OPTIONS: AttributeFieldOption[] = [
  { value: 'manual', labelEs: 'Manual', labelAr: 'يدوي' },
  { value: 'automatic', labelEs: 'Automático', labelAr: 'أوتوماتيك' },
  { value: 'cvt', labelEs: 'CVT', labelAr: 'CVT' },
  { value: 'semi_automatic', labelEs: 'Semiautomático', labelAr: 'شبه أوتوماتيك' },
];

const currentYear = new Date().getFullYear();

const YEAR_OPTIONS: AttributeFieldOption[] = Array.from(
  { length: currentYear + 1 - 1980 + 1 },
  (_, i) => {
    const y = String(currentYear + 1 - i);
    return { value: y, labelEs: y, labelAr: y };
  },
);

const PROPERTY_TYPE_RESIDENTIAL: AttributeFieldOption[] = [
  { value: 'apartment', labelEs: 'Piso / apartamento', labelAr: 'شقة' },
  { value: 'studio', labelEs: 'Estudio', labelAr: 'استوديو' },
  { value: 'duplex', labelEs: 'Dúplex', labelAr: 'دوبلكس' },
  { value: 'penthouse', labelEs: 'Ático / penthouse', labelAr: 'بنتهاوس' },
  { value: 'ground_floor', labelEs: 'Bajo / planta baja', labelAr: 'طابق أرضي' },
  { value: 'house', labelEs: 'Casa', labelAr: 'منزل' },
  { value: 'villa', labelEs: 'Villa / chalet', labelAr: 'فيلا' },
  { value: 'farmhouse', labelEs: 'Casa de campo', labelAr: 'منزل ريفي' },
  { value: 'room', labelEs: 'Habitación', labelAr: 'غرفة' },
  { value: 'loft', labelEs: 'Loft', labelAr: 'لوفت' },
  { value: 'other', labelEs: 'Otro', labelAr: 'آخر' },
];

const PROPERTY_TYPE_COMMERCIAL: AttributeFieldOption[] = [
  { value: 'shop', labelEs: 'Local comercial', labelAr: 'محل تجاري' },
  { value: 'office', labelEs: 'Oficina', labelAr: 'مكتب' },
  { value: 'warehouse', labelEs: 'Almacén', labelAr: 'مستودع' },
  { value: 'restaurant', labelEs: 'Restaurante / café', labelAr: 'مطعم / مقهى' },
  { value: 'clinic', labelEs: 'Clínica / consulta', labelAr: 'عيادة' },
  { value: 'garage', labelEs: 'Garaje / taller', labelAr: 'مرآب / ورشة' },
  { value: 'hotel', labelEs: 'Hotel / hostal', labelAr: 'فندق' },
  { value: 'showroom', labelEs: 'Showroom', labelAr: 'صالة عرض' },
  { value: 'industrial', labelEs: 'Nave industrial', labelAr: 'منشأة صناعية' },
  { value: 'other', labelEs: 'Otro', labelAr: 'آخر' },
];

const ROOM_OPTIONS: AttributeFieldOption[] = [
  { value: '0', labelEs: 'Estudio / 0', labelAr: 'استوديو' },
  { value: '1', labelEs: '1 habitación', labelAr: 'غرفة واحدة' },
  { value: '2', labelEs: '2 habitaciones', labelAr: 'غرفتان' },
  { value: '3', labelEs: '3 habitaciones', labelAr: '3 غرف' },
  { value: '4', labelEs: '4 habitaciones', labelAr: '4 غرف' },
  { value: '5', labelEs: '5 habitaciones', labelAr: '5 غرف' },
  { value: '6', labelEs: '6 habitaciones', labelAr: '6 غرف' },
  { value: '7', labelEs: '7 habitaciones', labelAr: '7 غرف' },
  { value: '8', labelEs: '8+', labelAr: '8+' },
];

const BATHROOM_OPTIONS: AttributeFieldOption[] = [
  { value: '1', labelEs: '1 baño', labelAr: 'حمام واحد' },
  { value: '2', labelEs: '2 baños', labelAr: 'حمامان' },
  { value: '3', labelEs: '3 baños', labelAr: '3 حمامات' },
  { value: '4', labelEs: '4+', labelAr: '4+' },
];

const FURNISHED_OPTIONS: AttributeFieldOption[] = [
  { value: 'furnished', labelEs: 'Amueblado', labelAr: 'مفروش' },
  { value: 'semi', labelEs: 'Semi-amueblado', labelAr: 'نصف مفروش' },
  { value: 'unfurnished', labelEs: 'Sin amueblar', labelAr: 'غير مفروش' },
];

const LAND_TYPE_OPTIONS: AttributeFieldOption[] = [
  { value: 'urban', labelEs: 'Urbano', labelAr: 'حضري' },
  { value: 'rural', labelEs: 'Rústico', labelAr: 'ريفي' },
  { value: 'agricultural', labelEs: 'Agrícola', labelAr: 'زراعي' },
  { value: 'industrial', labelEs: 'Industrial', labelAr: 'صناعي' },
  { value: 'coastal', labelEs: 'Costero', labelAr: 'ساحلي' },
  { value: 'desert', labelEs: 'Desierto / erial', labelAr: 'صحراوي' },
  { value: 'other', labelEs: 'Otro', labelAr: 'آخر' },
];

const FURNITURE_TYPE_OPTIONS: AttributeFieldOption[] = [
  { value: 'sofa', labelEs: 'Sofá', labelAr: 'أريكة' },
  { value: 'bed', labelEs: 'Cama', labelAr: 'سرير' },
  { value: 'table', labelEs: 'Mesa', labelAr: 'طاولة' },
  { value: 'wardrobe', labelEs: 'Armario', labelAr: 'خزانة' },
  { value: 'chair', labelEs: 'Sillas', labelAr: 'كراسي' },
  { value: 'kitchen', labelEs: 'Cocina', labelAr: 'مطبخ' },
  { value: 'other', labelEs: 'Otro', labelAr: 'آخر' },
];

const SALON_ITEM_OPTIONS: AttributeFieldOption[] = [
  { value: 'full_set', labelEs: 'Salón completo', labelAr: 'صالون كامل' },
  { value: 'base', labelEs: 'Base / asiento', labelAr: 'قاعدة الجلوس' },
  { value: 'cushions', labelEs: 'Cojines', labelAr: 'وسائد' },
  { value: 'carpet', labelEs: 'Alfombra', labelAr: 'سجادة' },
  { value: 'table', labelEs: 'Mesa baja', labelAr: 'طاولة منخفضة' },
  { value: 'other', labelEs: 'Otro', labelAr: 'آخر' },
];

const SALON_SHAPE_OPTIONS: AttributeFieldOption[] = [
  { value: 'linear', labelEs: 'Lineal', labelAr: 'مستقيم' },
  { value: 'l_shape', labelEs: 'En L', labelAr: 'شكل L' },
  { value: 'u_shape', labelEs: 'En U', labelAr: 'شكل U' },
  { value: 'modular', labelEs: 'Modular', labelAr: 'وحدات' },
  { value: 'n_a', labelEs: 'No aplica', labelAr: 'غير منطبق' },
];

const MEDICAL_ITEM_OPTIONS: AttributeFieldOption[] = [
  { value: 'mobility', labelEs: 'Movilidad / silla', labelAr: 'تنقل / كرسي' },
  { value: 'aids', labelEs: 'Ayudas técnicas', labelAr: 'مساعدات تقنية' },
  { value: 'monitoring', labelEs: 'Medición / control', labelAr: 'قياس ومراقبة' },
  { value: 'care', labelEs: 'Cuidado / higiene', labelAr: 'رعاية ونظافة' },
  { value: 'other', labelEs: 'Otro material', labelAr: 'مواد أخرى' },
];

const ELECTRONICS_TYPE_OPTIONS: AttributeFieldOption[] = [
  { value: 'laptop', labelEs: 'Portátil', labelAr: 'حاسوب محمول' },
  { value: 'desktop', labelEs: 'Sobremesa / PC', labelAr: 'حاسوب مكتبي' },
  { value: 'monitor', labelEs: 'Monitor', labelAr: 'شاشة' },
  { value: 'tv', labelEs: 'Televisor', labelAr: 'تلفاز' },
  { value: 'tablet', labelEs: 'Tablet', labelAr: 'جهاز لوحي' },
  { value: 'console', labelEs: 'Consola', labelAr: 'جهاز ألعاب' },
  { value: 'gaming', labelEs: 'Gaming / eSports', labelAr: 'ألعاب' },
  { value: 'audio', labelEs: 'Audio / altavoces', labelAr: 'صوتيات' },
  { value: 'headphones', labelEs: 'Auriculares', labelAr: 'سماعات' },
  { value: 'camera', labelEs: 'Cámara', labelAr: 'كاميرا' },
  { value: 'drone', labelEs: 'Dron', labelAr: 'طائرة بدون طيار' },
  { value: 'smartwatch', labelEs: 'Smartwatch', labelAr: 'ساعة ذكية' },
  { value: 'printer', labelEs: 'Impresora / escáner', labelAr: 'طابعة' },
  { value: 'networking', labelEs: 'Red / WiFi / router', labelAr: 'شبكات' },
  { value: 'appliance', labelEs: 'Electrodoméstico', labelAr: 'جهاز منزلي' },
  { value: 'fridge', labelEs: 'Nevera / frigorífico', labelAr: 'ثلاجة' },
  { value: 'washer', labelEs: 'Lavadora', labelAr: 'غسالة' },
  { value: 'ac', labelEs: 'Aire acondicionado', labelAr: 'مكيف' },
  { value: 'accessory', labelEs: 'Accesorio / cable', labelAr: 'إكسسوار' },
  { value: 'pos', labelEs: 'TPV / POS', labelAr: 'نقطة بيع' },
  { value: 'other', labelEs: 'Otro', labelAr: 'آخر' },
];

const ELECTRONICS_BRANDS: AttributeFieldOption[] = [
  { value: 'samsung', labelEs: 'Samsung', labelAr: 'سامسونج' },
  { value: 'lg', labelEs: 'LG', labelAr: 'إل جي' },
  { value: 'sony', labelEs: 'Sony', labelAr: 'سوني' },
  { value: 'apple', labelEs: 'Apple', labelAr: 'أبل' },
  { value: 'hp', labelEs: 'HP', labelAr: 'HP' },
  { value: 'dell', labelEs: 'Dell', labelAr: 'ديل' },
  { value: 'lenovo', labelEs: 'Lenovo', labelAr: 'لينوفو' },
  { value: 'asus', labelEs: 'Asus', labelAr: 'أسوس' },
  { value: 'acer', labelEs: 'Acer', labelAr: 'إيسر' },
  { value: 'msi', labelEs: 'MSI', labelAr: 'MSI' },
  { value: 'microsoft', labelEs: 'Microsoft', labelAr: 'مايكروسوفت' },
  { value: 'huawei', labelEs: 'Huawei', labelAr: 'هواوي' },
  { value: 'xiaomi', labelEs: 'Xiaomi', labelAr: 'شاومي' },
  { value: 'honor', labelEs: 'Honor', labelAr: 'هونر' },
  { value: 'tcl', labelEs: 'TCL', labelAr: 'تي سي إل' },
  { value: 'hisense', labelEs: 'Hisense', labelAr: 'هايسنس' },
  { value: 'philips', labelEs: 'Philips', labelAr: 'فيليبس' },
  { value: 'panasonic', labelEs: 'Panasonic', labelAr: 'باناسونيك' },
  { value: 'bosch', labelEs: 'Bosch', labelAr: 'بوش' },
  { value: 'whirlpool', labelEs: 'Whirlpool', labelAr: 'ويرلبول' },
  { value: 'canon', labelEs: 'Canon', labelAr: 'كانون' },
  { value: 'nikon', labelEs: 'Nikon', labelAr: 'نيكون' },
  { value: 'gopro', labelEs: 'GoPro', labelAr: 'جو برو' },
  { value: 'dji', labelEs: 'DJI', labelAr: 'دي جي آي' },
  { value: 'bose', labelEs: 'Bose', labelAr: 'بوز' },
  { value: 'jbl', labelEs: 'JBL', labelAr: 'جي بي إل' },
  { value: 'logitech', labelEs: 'Logitech', labelAr: 'لوجيتك' },
  { value: 'nintendo', labelEs: 'Nintendo', labelAr: 'نينتندو' },
  { value: 'playstation', labelEs: 'PlayStation / Sony', labelAr: 'بلايستيشن' },
  { value: 'xbox', labelEs: 'Xbox / Microsoft', labelAr: 'إكس بوكس' },
  { value: 'other', labelEs: 'Otra marca', labelAr: 'ماركة أخرى' },
];

const PHONE_BRANDS: AttributeFieldOption[] = [
  { value: 'samsung', labelEs: 'Samsung', labelAr: 'سامسونج' },
  { value: 'apple', labelEs: 'Apple / iPhone', labelAr: 'آيفون' },
  { value: 'xiaomi', labelEs: 'Xiaomi', labelAr: 'شاومي' },
  { value: 'huawei', labelEs: 'Huawei', labelAr: 'هواوي' },
  { value: 'honor', labelEs: 'Honor', labelAr: 'هونر' },
  { value: 'oppo', labelEs: 'Oppo', labelAr: 'أوبو' },
  { value: 'realme', labelEs: 'Realme', labelAr: 'ريلمي' },
  { value: 'vivo', labelEs: 'Vivo', labelAr: 'فيفو' },
  { value: 'oneplus', labelEs: 'OnePlus', labelAr: 'ون بلس' },
  { value: 'google', labelEs: 'Google Pixel', labelAr: 'جوجل بكسل' },
  { value: 'nokia', labelEs: 'Nokia', labelAr: 'نوكيا' },
  { value: 'motorola', labelEs: 'Motorola', labelAr: 'موتورولا' },
  { value: 'tecno', labelEs: 'Tecno', labelAr: 'تكنو' },
  { value: 'infinix', labelEs: 'Infinix', labelAr: 'إنفينيكس' },
  { value: 'itel', labelEs: 'Itel', labelAr: 'إيتل' },
  { value: 'nothing', labelEs: 'Nothing', labelAr: 'نثنغ' },
  { value: 'other', labelEs: 'Otra marca', labelAr: 'ماركة أخرى' },
];

const PHONE_STORAGE: AttributeFieldOption[] = [
  { value: '16', labelEs: '16 GB', labelAr: '16 GB' },
  { value: '32', labelEs: '32 GB', labelAr: '32 GB' },
  { value: '64', labelEs: '64 GB', labelAr: '64 GB' },
  { value: '128', labelEs: '128 GB', labelAr: '128 GB' },
  { value: '256', labelEs: '256 GB', labelAr: '256 GB' },
  { value: '512', labelEs: '512 GB', labelAr: '512 GB' },
  { value: '1024', labelEs: '1 TB', labelAr: '1 تيرا' },
];

const PHONE_CONDITION: AttributeFieldOption[] = [
  { value: 'new', labelEs: 'Nuevo', labelAr: 'جديد' },
  { value: 'like_new', labelEs: 'Como nuevo', labelAr: 'كالجديد' },
  { value: 'used', labelEs: 'Usado', labelAr: 'مستعمل' },
  { value: 'for_parts', labelEs: 'Para piezas', labelAr: 'للقطع' },
];

export const LISTING_ATTRIBUTE_SCHEMAS: ListingAttributeSchema[] = [
  {
    id: 'vehicle',
    categorySlugs: ['cars', 'car-rentals'],
    descriptionMinLength: 0,
    fields: [
      {
        key: 'brand',
        labelEs: 'Marca',
        labelAr: 'الماركة',
        type: 'select',
        required: true,
        options: CAR_BRANDS,
      },
      {
        key: 'brandOther',
        labelEs: 'Nombre de la marca',
        labelAr: 'اسم الماركة',
        type: 'text',
        placeholder: 'Ej: Mitsubishi',
      },
      {
        key: 'model',
        labelEs: 'Modelo',
        labelAr: 'الموديل',
        type: 'text',
        placeholder: 'Ej: Corolla, Clio, Duster…',
      },
      {
        key: 'bodyType',
        labelEs: 'Carrocería',
        labelAr: 'نوع الهيكل',
        type: 'select',
        required: true,
        options: BODY_TYPE_OPTIONS,
      },
      {
        key: 'year',
        labelEs: 'Año',
        labelAr: 'السنة',
        type: 'select',
        required: true,
        options: YEAR_OPTIONS,
      },
      {
        key: 'mileageKm',
        labelEs: 'Kilómetros',
        labelAr: 'الكيلومترات',
        type: 'number',
        required: true,
        min: 0,
        placeholder: '85000',
      },
      {
        key: 'fuel',
        labelEs: 'Combustible',
        labelAr: 'الوقود',
        type: 'select',
        required: true,
        options: FUEL_OPTIONS,
      },
      {
        key: 'transmission',
        labelEs: 'Cambio',
        labelAr: 'ناقل الحركة',
        type: 'select',
        required: true,
        options: TRANSMISSION_OPTIONS,
      },
      {
        key: 'doors',
        labelEs: 'Puertas',
        labelAr: 'الأبواب',
        type: 'select',
        options: DOORS_OPTIONS,
      },
      {
        key: 'condition',
        labelEs: 'Estado',
        labelAr: 'الحالة',
        type: 'select',
        required: true,
        options: PHONE_CONDITION,
      },
    ],
  },
  {
    id: 'residential',
    categorySlugs: ['residential-sale', 'residential-rent'],
    descriptionMinLength: 0,
    fields: [
      {
        key: 'propertyType',
        labelEs: 'Tipo de vivienda',
        labelAr: 'نوع السكن',
        type: 'select',
        required: true,
        options: PROPERTY_TYPE_RESIDENTIAL,
      },
      {
        key: 'rooms',
        labelEs: 'Habitaciones',
        labelAr: 'الغرف',
        type: 'select',
        required: true,
        options: ROOM_OPTIONS,
      },
      {
        key: 'bathrooms',
        labelEs: 'Baños',
        labelAr: 'الحمامات',
        type: 'select',
        options: BATHROOM_OPTIONS,
      },
      {
        key: 'areaM2',
        labelEs: 'Metros cuadrados',
        labelAr: 'المتر المربع',
        type: 'number',
        required: true,
        min: 1,
        placeholder: '85',
      },
      {
        key: 'furnished',
        labelEs: 'Amueblado',
        labelAr: 'التأثيث',
        type: 'select',
        options: FURNISHED_OPTIONS,
      },
    ],
  },
  {
    id: 'lands',
    categorySlugs: ['lands'],
    descriptionMinLength: 0,
    fields: [
      {
        key: 'propertyType',
        labelEs: 'Tipo de terreno',
        labelAr: 'نوع الأرض',
        type: 'select',
        required: true,
        options: LAND_TYPE_OPTIONS,
      },
      {
        key: 'areaM2',
        labelEs: 'Superficie (m²)',
        labelAr: 'المساحة (م²)',
        type: 'number',
        required: true,
        min: 1,
        placeholder: '500',
      },
    ],
  },
  {
    id: 'commercial',
    categorySlugs: ['commercial-sale', 'commercial-rent'],
    descriptionMinLength: 0,
    fields: [
      {
        key: 'propertyType',
        labelEs: 'Tipo de local',
        labelAr: 'نوع المحل',
        type: 'select',
        required: true,
        options: PROPERTY_TYPE_COMMERCIAL,
      },
      {
        key: 'areaM2',
        labelEs: 'Metros cuadrados',
        labelAr: 'المتر المربع',
        type: 'number',
        required: true,
        min: 1,
        placeholder: '120',
      },
    ],
  },
  {
    id: 'furniture',
    categorySlugs: ['furniture'],
    descriptionMinLength: 0,
    fields: [
      {
        key: 'propertyType',
        labelEs: 'Tipo de mueble',
        labelAr: 'نوع الأثاث',
        type: 'select',
        required: true,
        options: FURNITURE_TYPE_OPTIONS,
      },
      {
        key: 'condition',
        labelEs: 'Estado',
        labelAr: 'الحالة',
        type: 'select',
        required: true,
        options: PHONE_CONDITION,
      },
    ],
  },
  {
    id: 'salons-carpets',
    categorySlugs: ['salons-carpets'],
    descriptionMinLength: 0,
    fields: [
      {
        key: 'propertyType',
        labelEs: 'Qué vendes',
        labelAr: 'ماذا تبيع',
        type: 'select',
        required: true,
        options: SALON_ITEM_OPTIONS,
      },
      {
        key: 'shape',
        labelEs: 'Forma del salón',
        labelAr: 'شكل الصالون',
        type: 'select',
        required: true,
        options: SALON_SHAPE_OPTIONS,
      },
      {
        key: 'seats',
        labelEs: 'Plazas (aprox.)',
        labelAr: 'عدد المقاعد تقريباً',
        type: 'number',
        required: false,
        min: 1,
        placeholder: '6',
      },
      {
        key: 'condition',
        labelEs: 'Estado',
        labelAr: 'الحالة',
        type: 'select',
        required: true,
        options: PHONE_CONDITION,
      },
    ],
  },
  {
    id: 'medical',
    categorySlugs: ['health'],
    descriptionMinLength: 20,
    fields: [
      {
        key: 'propertyType',
        labelEs: 'Tipo de material',
        labelAr: 'نوع المادة',
        type: 'select',
        required: true,
        options: MEDICAL_ITEM_OPTIONS,
      },
      {
        key: 'condition',
        labelEs: 'Estado',
        labelAr: 'الحالة',
        type: 'select',
        required: true,
        options: PHONE_CONDITION,
      },
    ],
  },
  {
    id: 'mobile',
    categorySlugs: ['mobiles'],
    descriptionMinLength: 0,
    fields: [
      {
        key: 'brand',
        labelEs: 'Marca',
        labelAr: 'الماركة',
        type: 'select',
        required: true,
        options: PHONE_BRANDS,
      },
      {
        key: 'brandOther',
        labelEs: 'Nombre de la marca',
        labelAr: 'اسم الماركة',
        type: 'text',
        placeholder: 'Ej: Infinix',
      },
      {
        key: 'storage',
        labelEs: 'Almacenamiento',
        labelAr: 'التخزين',
        type: 'select',
        required: true,
        options: PHONE_STORAGE,
      },
      {
        key: 'condition',
        labelEs: 'Estado',
        labelAr: 'الحالة',
        type: 'select',
        required: true,
        options: PHONE_CONDITION,
      },
    ],
  },
  {
    id: 'electronics',
    categorySlugs: ['electronics', 'pos'],
    descriptionMinLength: 0,
    fields: [
      {
        key: 'propertyType',
        labelEs: 'Tipo de dispositivo',
        labelAr: 'نوع الجهاز',
        type: 'select',
        required: true,
        options: ELECTRONICS_TYPE_OPTIONS,
      },
      {
        key: 'brand',
        labelEs: 'Marca',
        labelAr: 'الماركة',
        type: 'select',
        required: true,
        options: ELECTRONICS_BRANDS,
      },
      {
        key: 'brandOther',
        labelEs: 'Nombre de la marca',
        labelAr: 'اسم الماركة',
        type: 'text',
        placeholder: 'Ej: Acer',
      },
      {
        key: 'condition',
        labelEs: 'Estado',
        labelAr: 'الحالة',
        type: 'select',
        required: true,
        options: PHONE_CONDITION,
      },
    ],
  },
];

const vehicleAttributesSchema = z
  .object({
    brand: z.string().min(1),
    brandOther: z.string().max(60).optional(),
    model: z.string().max(80).optional(),
    bodyType: z
      .enum([
        'sedan',
        'hatchback',
        'suv',
        '4x4',
        'pickup',
        'van',
        'minibus',
        'coupe',
        'wagon',
        'convertible',
        'other',
      ])
      .optional(),
    year: z.coerce.number().int().min(1980).max(currentYear + 1),
    mileageKm: z.coerce.number().min(0),
    fuel: z.enum(['petrol', 'diesel', 'hybrid', 'plugin_hybrid', 'electric', 'lpg', 'cng']),
    transmission: z.enum(['manual', 'automatic', 'cvt', 'semi_automatic']).optional(),
    doors: z.enum(['2', '3', '4', '5']).optional(),
    condition: z.enum(['new', 'like_new', 'used', 'for_parts']).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.brand === 'other' && !data.brandOther?.trim()) {
      ctx.addIssue({ code: 'custom', message: 'Indica la marca', path: ['brandOther'] });
    }
  });

const residentialAttributesSchema = z.object({
  propertyType: z.enum([
    'apartment',
    'studio',
    'duplex',
    'penthouse',
    'ground_floor',
    'house',
    'villa',
    'farmhouse',
    'room',
    'loft',
    'other',
  ]),
  rooms: z.coerce.number().int().min(0).max(20),
  bathrooms: z.enum(['1', '2', '3', '4']).optional(),
  areaM2: z.coerce.number().positive(),
  furnished: z.enum(['furnished', 'semi', 'unfurnished']).optional(),
});

const landsAttributesSchema = z.object({
  propertyType: z.enum([
    'urban',
    'rural',
    'agricultural',
    'industrial',
    'coastal',
    'desert',
    'other',
  ]),
  areaM2: z.coerce.number().positive(),
});

const commercialAttributesSchema = z.object({
  propertyType: z.enum([
    'shop',
    'office',
    'warehouse',
    'restaurant',
    'clinic',
    'garage',
    'hotel',
    'showroom',
    'industrial',
    'other',
  ]),
  areaM2: z.coerce.number().positive(),
});

const furnitureAttributesSchema = z.object({
  propertyType: z.enum(['sofa', 'bed', 'table', 'wardrobe', 'chair', 'kitchen', 'other']),
  condition: z.enum(['new', 'like_new', 'used', 'for_parts']),
});

const salonsCarpetsAttributesSchema = z.object({
  propertyType: z.enum(['full_set', 'base', 'cushions', 'carpet', 'table', 'other']),
  shape: z.enum(['linear', 'l_shape', 'u_shape', 'modular', 'n_a']),
  seats: z.coerce.number().int().positive().optional(),
  condition: z.enum(['new', 'like_new', 'used', 'for_parts']),
});

const medicalAttributesSchema = z.object({
  propertyType: z.enum(['mobility', 'aids', 'monitoring', 'care', 'other']),
  condition: z.enum(['new', 'like_new', 'used', 'for_parts']),
});

const mobileAttributesSchema = z
  .object({
    brand: z.string().min(1),
    brandOther: z.string().max(60).optional(),
    storage: z.enum(['16', '32', '64', '128', '256', '512', '1024']),
    condition: z.enum(['new', 'like_new', 'used', 'for_parts']),
  })
  .superRefine((data, ctx) => {
    if (data.brand === 'other' && !data.brandOther?.trim()) {
      ctx.addIssue({ code: 'custom', message: 'Indica la marca', path: ['brandOther'] });
    }
  });

const electronicsAttributesSchema = z
  .object({
    propertyType: z.enum([
      'laptop',
      'desktop',
      'monitor',
      'tv',
      'tablet',
      'console',
      'gaming',
      'audio',
      'headphones',
      'camera',
      'drone',
      'smartwatch',
      'printer',
      'networking',
      'appliance',
      'fridge',
      'washer',
      'ac',
      'accessory',
      'pos',
      'other',
    ]),
    brand: z.string().min(1),
    brandOther: z.string().max(60).optional(),
    condition: z.enum(['new', 'like_new', 'used', 'for_parts']),
  })
  .superRefine((data, ctx) => {
    if (data.brand === 'other' && !data.brandOther?.trim()) {
      ctx.addIssue({ code: 'custom', message: 'Indica la marca', path: ['brandOther'] });
    }
  });

const SCHEMA_BY_ID: Record<string, z.ZodTypeAny> = {
  vehicle: vehicleAttributesSchema,
  residential: residentialAttributesSchema,
  lands: landsAttributesSchema,
  commercial: commercialAttributesSchema,
  furniture: furnitureAttributesSchema,
  'salons-carpets': salonsCarpetsAttributesSchema,
  medical: medicalAttributesSchema,
  mobile: mobileAttributesSchema,
  electronics: electronicsAttributesSchema,
};

export function getListingAttributeSchema(categorySlug: string): ListingAttributeSchema | null {
  return LISTING_ATTRIBUTE_SCHEMAS.find((s) => s.categorySlugs.includes(categorySlug)) ?? null;
}

export function categoryHasStructuredAttributes(categorySlug: string): boolean {
  return getListingAttributeSchema(categorySlug) !== null;
}

export function getDescriptionMinLength(categorySlug: string): number {
  return getListingAttributeSchema(categorySlug)?.descriptionMinLength ?? 10;
}

/** Valida y normaliza attributes; lanza ZodError si falla */
export function validateListingAttributes(
  categorySlug: string,
  attributes: unknown,
): Record<string, unknown> {
  const schema = getListingAttributeSchema(categorySlug);
  if (!schema) {
    if (attributes == null || (typeof attributes === 'object' && !Object.keys(attributes as object).length)) {
      return {};
    }
    throw new Error('Esta categoría no admite campos estructurados');
  }

  const zodSchema = SCHEMA_BY_ID[schema.id];
  if (!zodSchema) return {};

  const parsed = zodSchema.parse(attributes ?? {});
  return stripEmpty(parsed as Record<string, unknown>);
}

function stripEmpty(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === '') continue;
    out[k] = v;
  }
  return out;
}

/** Comprueba si el vendedor completó los campos obligatorios (UI) */
export function areRequiredAttributesFilled(
  categorySlug: string,
  attributes: Record<string, unknown>,
): boolean {
  const schema = getListingAttributeSchema(categorySlug);
  if (!schema) return true;

  for (const field of schema.fields) {
    if (!field.required) continue;
    if (field.key === 'brandOther' && attributes.brand !== 'other') continue;
    const v = attributes[field.key];
    if (v === undefined || v === null || v === '') return false;
  }

  try {
    validateListingAttributes(categorySlug, attributes);
    return true;
  } catch {
    return false;
  }
}

function labelForOption(options: AttributeFieldOption[] | undefined, value: string): string {
  return options?.find((o) => o.value === value)?.labelEs ?? value;
}

function brandLabel(attrs: Record<string, unknown>): string {
  const brand = String(attrs.brand ?? '');
  if (brand === 'other') return String(attrs.brandOther ?? 'Otra marca');
  const fromCars = labelForOption(CAR_BRANDS, brand);
  if (fromCars !== brand) return fromCars;
  const fromPhones = labelForOption(PHONE_BRANDS, brand);
  if (fromPhones !== brand) return fromPhones;
  return labelForOption(ELECTRONICS_BRANDS, brand);
}

const FUEL_LABELS: Record<string, string> = Object.fromEntries(
  FUEL_OPTIONS.map((o) => [o.value, o.labelEs]),
);
const TRANS_LABELS: Record<string, string> = Object.fromEntries(
  TRANSMISSION_OPTIONS.map((o) => [o.value, o.labelEs]),
);
const BODY_LABELS: Record<string, string> = Object.fromEntries(
  BODY_TYPE_OPTIONS.map((o) => [o.value, o.labelEs]),
);
const RES_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  PROPERTY_TYPE_RESIDENTIAL.map((o) => [o.value, o.labelEs]),
);
const COM_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  PROPERTY_TYPE_COMMERCIAL.map((o) => [o.value, o.labelEs]),
);

/** Chips cortos para tarjetas y fichas */
export function formatAttributeHighlights(
  categorySlug: string,
  attributes: Record<string, unknown> | undefined,
): string[] {
  if (!attributes || !Object.keys(attributes).length) return [];

  const schema = getListingAttributeSchema(categorySlug);
  if (!schema) return [];

  const chips: string[] = [];

  if (schema.id === 'vehicle') {
    if (attributes.brand) chips.push(brandLabel(attributes));
    if (attributes.year) chips.push(String(attributes.year));
    if (attributes.model) chips.push(String(attributes.model));
    if (attributes.bodyType) {
      chips.push(BODY_LABELS[String(attributes.bodyType)] ?? String(attributes.bodyType));
    }
    if (attributes.mileageKm != null) {
      chips.push(`${Number(attributes.mileageKm).toLocaleString('es-ES')} km`);
    }
    if (attributes.fuel) chips.push(FUEL_LABELS[String(attributes.fuel)] ?? String(attributes.fuel));
    if (attributes.transmission) {
      chips.push(TRANS_LABELS[String(attributes.transmission)] ?? String(attributes.transmission));
    }
    return chips.slice(0, 5);
  }

  if (schema.id === 'residential' || schema.id === 'commercial') {
    const typeKey = String(attributes.propertyType ?? '');
    const typeLabels = schema.id === 'residential' ? RES_TYPE_LABELS : COM_TYPE_LABELS;
    if (typeKey) chips.push(typeLabels[typeKey] ?? typeKey);
    if (attributes.rooms != null && schema.id === 'residential') {
      chips.push(`${attributes.rooms} hab.`);
    }
    if (attributes.bathrooms && schema.id === 'residential') {
      chips.push(`${attributes.bathrooms} baños`);
    }
    if (attributes.areaM2) chips.push(`${attributes.areaM2} m²`);
    if (attributes.furnished && schema.id === 'residential') {
      chips.push(labelForOption(FURNISHED_OPTIONS, String(attributes.furnished)));
    }
    return chips.slice(0, 5);
  }

  if (schema.id === 'lands') {
    if (attributes.propertyType) {
      chips.push(labelForOption(LAND_TYPE_OPTIONS, String(attributes.propertyType)));
    }
    if (attributes.areaM2) chips.push(`${attributes.areaM2} m²`);
    return chips;
  }

  if (schema.id === 'furniture') {
    if (attributes.propertyType) {
      chips.push(labelForOption(FURNITURE_TYPE_OPTIONS, String(attributes.propertyType)));
    }
    if (attributes.condition) {
      chips.push(labelForOption(PHONE_CONDITION, String(attributes.condition)));
    }
    return chips;
  }

  if (schema.id === 'salons-carpets') {
    if (attributes.propertyType) {
      chips.push(labelForOption(SALON_ITEM_OPTIONS, String(attributes.propertyType)));
    }
    if (attributes.shape && attributes.shape !== 'n_a') {
      chips.push(labelForOption(SALON_SHAPE_OPTIONS, String(attributes.shape)));
    }
    if (attributes.seats) chips.push(`${attributes.seats} plazas`);
    if (attributes.condition) {
      chips.push(labelForOption(PHONE_CONDITION, String(attributes.condition)));
    }
    return chips;
  }

  if (schema.id === 'medical') {
    if (attributes.propertyType) {
      chips.push(labelForOption(MEDICAL_ITEM_OPTIONS, String(attributes.propertyType)));
    }
    if (attributes.condition) {
      chips.push(labelForOption(PHONE_CONDITION, String(attributes.condition)));
    }
    return chips;
  }

  if (schema.id === 'mobile') {
    if (attributes.brand) chips.push(brandLabel(attributes));
    if (attributes.storage) chips.push(`${attributes.storage} GB`);
    if (attributes.condition) {
      chips.push(labelForOption(PHONE_CONDITION, String(attributes.condition)));
    }
    return chips;
  }

  if (schema.id === 'electronics') {
    if (attributes.propertyType) {
      chips.push(labelForOption(ELECTRONICS_TYPE_OPTIONS, String(attributes.propertyType)));
    }
    if (attributes.brand) chips.push(brandLabel(attributes));
    if (attributes.condition) {
      chips.push(labelForOption(PHONE_CONDITION, String(attributes.condition)));
    }
    return chips;
  }

  return chips;
}

/** Pares etiqueta-valor para ficha detalle */
export function formatAttributeDetails(
  categorySlug: string,
  attributes: Record<string, unknown> | undefined,
): { label: string; labelAr: string; value: string }[] {
  const schema = getListingAttributeSchema(categorySlug);
  if (!schema || !attributes) return [];

  const rows: { label: string; labelAr: string; value: string }[] = [];

  for (const field of schema.fields) {
    const raw = attributes[field.key];
    if (raw === undefined || raw === null || raw === '') continue;
    if (field.key === 'brandOther' && attributes.brand !== 'other') continue;

    let value = String(raw);
    if (field.key === 'brand') value = brandLabel(attributes);
    else if (field.type === 'select' && field.options) {
      value = labelForOption(field.options, String(raw));
    } else if (field.key === 'mileageKm') {
      value = `${Number(raw).toLocaleString('es-ES')} km`;
    } else if (field.key === 'areaM2') {
      value = `${raw} m²`;
    }

    rows.push({ label: field.labelEs, labelAr: field.labelAr, value });
  }

  return rows;
}

/** Filtros de búsqueda por categoría (comprador) */
export type ListingAttributeFilterDef = {
  param: string;
  labelEs: string;
  labelAr: string;
  type: 'select' | 'number';
  options?: AttributeFieldOption[];
  placeholder?: string;
};

export const listingAttributeFilterSchema = z.object({
  brand: z.string().optional(),
  yearMin: z.coerce.number().int().optional(),
  yearMax: z.coerce.number().int().optional(),
  areaMin: z.coerce.number().positive().optional(),
  propertyType: z.string().optional(),
  fuel: z.string().optional(),
  storage: z.string().optional(),
  transmission: z.string().optional(),
  bodyType: z.string().optional(),
  rooms: z.coerce.number().int().optional(),
  condition: z.string().optional(),
  furnished: z.string().optional(),
});

export type ListingAttributeFilterValues = z.infer<typeof listingAttributeFilterSchema>;

/** Keys de filtros de atributos (URL / API) — mantener en sync con el schema */
export const LISTING_ATTR_FILTER_KEYS = [
  'brand',
  'yearMin',
  'yearMax',
  'areaMin',
  'propertyType',
  'fuel',
  'storage',
  'transmission',
  'bodyType',
  'rooms',
  'condition',
  'furnished',
] as const satisfies ReadonlyArray<keyof ListingAttributeFilterValues>;

export function hasActiveAttributeFilters(filters: ListingAttributeFilterValues): boolean {
  return Object.values(filters).some((v) => v !== undefined && v !== '');
}

export function getListingAttributeFilters(categorySlug: string): ListingAttributeFilterDef[] {
  const schema = getListingAttributeSchema(categorySlug);
  if (!schema) return [];

  if (schema.id === 'vehicle') {
    return [
      {
        param: 'brand',
        labelEs: 'Marca',
        labelAr: 'الماركة',
        type: 'select',
        options: CAR_BRANDS.filter((b) => b.value !== 'other'),
      },
      {
        param: 'bodyType',
        labelEs: 'Carrocería',
        labelAr: 'نوع الهيكل',
        type: 'select',
        options: BODY_TYPE_OPTIONS,
      },
      {
        param: 'yearMin',
        labelEs: 'Año desde',
        labelAr: 'من سنة',
        type: 'select',
        options: YEAR_OPTIONS,
      },
      {
        param: 'yearMax',
        labelEs: 'Año hasta',
        labelAr: 'إلى سنة',
        type: 'select',
        options: YEAR_OPTIONS,
      },
      {
        param: 'fuel',
        labelEs: 'Combustible',
        labelAr: 'الوقود',
        type: 'select',
        options: FUEL_OPTIONS,
      },
      {
        param: 'transmission',
        labelEs: 'Cambio',
        labelAr: 'ناقل الحركة',
        type: 'select',
        options: TRANSMISSION_OPTIONS,
      },
      {
        param: 'condition',
        labelEs: 'Estado',
        labelAr: 'الحالة',
        type: 'select',
        options: PHONE_CONDITION,
      },
    ];
  }

  if (schema.id === 'residential') {
    return [
      {
        param: 'propertyType',
        labelEs: 'Tipo',
        labelAr: 'النوع',
        type: 'select',
        options: PROPERTY_TYPE_RESIDENTIAL,
      },
      {
        param: 'rooms',
        labelEs: 'Habitaciones',
        labelAr: 'الغرف',
        type: 'select',
        options: ROOM_OPTIONS,
      },
      {
        param: 'furnished',
        labelEs: 'Amueblado',
        labelAr: 'التأثيث',
        type: 'select',
        options: FURNISHED_OPTIONS,
      },
      {
        param: 'areaMin',
        labelEs: 'M² mínimo',
        labelAr: 'م² كحد أدنى',
        type: 'number',
        placeholder: '60',
      },
    ];
  }

  if (schema.id === 'commercial') {
    return [
      {
        param: 'propertyType',
        labelEs: 'Tipo',
        labelAr: 'النوع',
        type: 'select',
        options: PROPERTY_TYPE_COMMERCIAL,
      },
      {
        param: 'areaMin',
        labelEs: 'M² mínimo',
        labelAr: 'م² كحد أدنى',
        type: 'number',
        placeholder: '60',
      },
    ];
  }

  if (schema.id === 'lands') {
    return [
      {
        param: 'propertyType',
        labelEs: 'Tipo',
        labelAr: 'النوع',
        type: 'select',
        options: LAND_TYPE_OPTIONS,
      },
      {
        param: 'areaMin',
        labelEs: 'M² mínimo',
        labelAr: 'م² كحد أدنى',
        type: 'number',
        placeholder: '200',
      },
    ];
  }

  if (schema.id === 'furniture') {
    return [
      {
        param: 'propertyType',
        labelEs: 'Tipo',
        labelAr: 'النوع',
        type: 'select',
        options: FURNITURE_TYPE_OPTIONS,
      },
      {
        param: 'condition',
        labelEs: 'Estado',
        labelAr: 'الحالة',
        type: 'select',
        options: PHONE_CONDITION,
      },
    ];
  }

  if (schema.id === 'salons-carpets') {
    return [
      {
        param: 'propertyType',
        labelEs: 'Qué es',
        labelAr: 'النوع',
        type: 'select',
        options: SALON_ITEM_OPTIONS,
      },
      {
        param: 'condition',
        labelEs: 'Estado',
        labelAr: 'الحالة',
        type: 'select',
        options: PHONE_CONDITION,
      },
    ];
  }

  if (schema.id === 'medical') {
    return [
      {
        param: 'propertyType',
        labelEs: 'Tipo',
        labelAr: 'النوع',
        type: 'select',
        options: MEDICAL_ITEM_OPTIONS,
      },
      {
        param: 'condition',
        labelEs: 'Estado',
        labelAr: 'الحالة',
        type: 'select',
        options: PHONE_CONDITION,
      },
    ];
  }

  if (schema.id === 'mobile') {
    return [
      {
        param: 'brand',
        labelEs: 'Marca',
        labelAr: 'الماركة',
        type: 'select',
        options: PHONE_BRANDS.filter((b) => b.value !== 'other'),
      },
      {
        param: 'storage',
        labelEs: 'Almacenamiento',
        labelAr: 'التخزين',
        type: 'select',
        options: PHONE_STORAGE,
      },
      {
        param: 'condition',
        labelEs: 'Estado',
        labelAr: 'الحالة',
        type: 'select',
        options: PHONE_CONDITION,
      },
    ];
  }

  if (schema.id === 'electronics') {
    return [
      {
        param: 'propertyType',
        labelEs: 'Tipo',
        labelAr: 'النوع',
        type: 'select',
        options: ELECTRONICS_TYPE_OPTIONS,
      },
      {
        param: 'brand',
        labelEs: 'Marca',
        labelAr: 'الماركة',
        type: 'select',
        options: ELECTRONICS_BRANDS.filter((b) => b.value !== 'other'),
      },
      {
        param: 'condition',
        labelEs: 'Estado',
        labelAr: 'الحالة',
        type: 'select',
        options: PHONE_CONDITION,
      },
    ];
  }

  return [];
}

/** Título sugerido para el vendedor a partir de attributes */
export function suggestListingTitle(
  categorySlug: string,
  attributes: Record<string, unknown>,
): string | null {
  const schema = getListingAttributeSchema(categorySlug);
  if (!schema) return null;

  if (schema.id === 'vehicle') {
    if (!attributes.brand || !attributes.year) return null;
    const model = attributes.model ? ` ${String(attributes.model)}` : '';
    return `${brandLabel(attributes)}${model} ${attributes.year}`;
  }

  if (schema.id === 'mobile') {
    if (!attributes.brand) return null;
    const storage = attributes.storage ? ` ${attributes.storage}GB` : '';
    return `${brandLabel(attributes)}${storage}`;
  }

  if (schema.id === 'residential' || schema.id === 'commercial') {
    if (!attributes.propertyType || !attributes.areaM2) return null;
    const typeLabels = schema.id === 'residential' ? RES_TYPE_LABELS : COM_TYPE_LABELS;
    const type = typeLabels[String(attributes.propertyType)] ?? String(attributes.propertyType);
    const rooms =
      schema.id === 'residential' && attributes.rooms != null
        ? ` · ${attributes.rooms} hab.`
        : '';
    return `${type}${rooms} · ${attributes.areaM2} m²`;
  }

  if (schema.id === 'lands' && attributes.areaM2) {
    const type = attributes.propertyType
      ? `${labelForOption(LAND_TYPE_OPTIONS, String(attributes.propertyType))} · `
      : '';
    return `${type}Terreno ${attributes.areaM2} m²`;
  }

  if (schema.id === 'furniture' && attributes.propertyType) {
    return labelForOption(FURNITURE_TYPE_OPTIONS, String(attributes.propertyType));
  }

  if (schema.id === 'salons-carpets' && attributes.propertyType) {
    const kind = labelForOption(SALON_ITEM_OPTIONS, String(attributes.propertyType));
    const seats = attributes.seats ? ` · ${attributes.seats} plazas` : '';
    return `${kind}${seats}`;
  }

  if (schema.id === 'medical' && attributes.propertyType) {
    return labelForOption(MEDICAL_ITEM_OPTIONS, String(attributes.propertyType));
  }

  if (schema.id === 'electronics') {
    if (!attributes.propertyType || !attributes.brand) return null;
    const type = labelForOption(ELECTRONICS_TYPE_OPTIONS, String(attributes.propertyType));
    return `${brandLabel(attributes)} ${type}`;
  }

  return null;
}
