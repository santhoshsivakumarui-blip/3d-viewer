import { BimElement, ModelPreset } from "./types";

export const MODEL_PRESETS: ModelPreset[] = [
  {
    id: "villa",
    name: "Modern Minimalist Villa (LOD 400)",
    description: "A two-story luxury architectural residence with floating concrete slabs, high-performance glass facades, steel columns, and an open-concept living area.",
    elementsCount: 42,
  },
  {
    id: "office",
    name: "Commercial Office Core (LOD 350)",
    description: "A five-story office structure highlighting a central shear-wall core, precast floor planks, curtain wall facades, and structural steel framing.",
    elementsCount: 78,
  },
  {
    id: "warehouse",
    name: "Logistics Hub & Industrial Warehouse (LOD 300)",
    description: "An industrial portal frame warehouse with deep foundation pads, steel trusses, insulated sandwich wall cladding, and heavy-duty loading docks.",
    elementsCount: 29,
  }
];

// Helper to create unique IDs for elements
let elementCounter = 100;
const nextId = (prefix = "#") => `${prefix}${elementCounter++}`;

// --- PRESET 1: VILLA IFC HIERARCHY ---
export const VILLA_HIERARCHY: BimElement = {
  id: "#10",
  type: "IfcProject",
  name: "Modern Villa Project",
  visible: true,
  properties: {
    GlobalId: "3mK$8_dY19vP4WzQr7f3Lm",
    Name: "Minimalist Villa Project",
    Description: "Architectural LOD 400 Residential Building",
    Phase: "Construction Documentation",
  },
  children: [
    {
      id: "#20",
      type: "IfcSite",
      name: "Residential Lot 14B",
      visible: true,
      properties: {
        GlobalId: "0bL9z_rP52vQ3WzXr9f4Np",
        Elevation: "45.2 m",
        Latitude: "37.7749° N",
        Longitude: "-122.4194° W",
        SiteSoilClass: "S2 (Stable Sand/Gravel)"
      },
      children: [
        {
          id: "#30",
          type: "IfcBuilding",
          name: "Villa Structure",
          visible: true,
          properties: {
            GlobalId: "1cM0x_sQ63vR4WzYr0f5Oq",
            BuildingAddress: "124 Forest Glen Dr",
            StructuralSystem: "Reinforced Concrete Flat Slab & Steel Columns",
            GrossArea: "320 m²",
            EnergyClass: "A++ Zero Carbon",
          },
          children: [
            {
              id: "#40",
              type: "IfcBuildingStorey",
              name: "Ground Floor (Level 0.00)",
              visible: true,
              properties: {
                GlobalId: "2dN1y_tR74vS5WzZr1f6Pr",
                Elevation: "0.00 m",
                Height: "3.20 m",
                StoreyType: "Living Area & Garage",
              },
              children: [
                {
                  id: "#101",
                  type: "IfcSlab",
                  name: "Foundation Slab - Concrete",
                  visible: true,
                  properties: {
                    GlobalId: "5jA1z_qW44vX9WzUr2f7St",
                    Material: "Concrete C30/37",
                    Thickness: "300 mm",
                    LoadBearing: "YES",
                    Volume: "48.0 m³",
                    Area: "160 m²",
                    FireRating: "REI 120",
                  }
                },
                {
                  id: "#102",
                  type: "IfcWallStandardCase",
                  name: "North Wall - Raw Concrete Finish",
                  visible: true,
                  properties: {
                    GlobalId: "6kB2a_rX55vY0WzVr3f8Tu",
                    Material: "Exposed Concrete",
                    Thickness: "250 mm",
                    LoadBearing: "YES",
                    Height: "3.20 m",
                    Area: "45.0 m²",
                    Volume: "11.25 m³",
                    FireRating: "REI 90",
                  }
                },
                {
                  id: "#103",
                  type: "IfcWallStandardCase",
                  name: "South Wall - Timber Cladded Drywall",
                  visible: true,
                  properties: {
                    GlobalId: "7lC3b_sY66vZ1WzWr4f9Uv",
                    Material: "Drywall with Red Cedar Siding",
                    Thickness: "200 mm",
                    LoadBearing: "NO",
                    Height: "3.20 m",
                    Area: "38.5 m²",
                    Volume: "7.7 m³",
                    FireRating: "REI 30",
                  }
                },
                {
                  id: "#104",
                  type: "IfcWallStandardCase",
                  name: "West Party Wall - Insulated Structural",
                  visible: true,
                  properties: {
                    GlobalId: "8mD4c_tZ77va2WzXr5f0Ww",
                    Material: "Double CMU Block + PIR Insulation",
                    Thickness: "350 mm",
                    LoadBearing: "YES",
                    Height: "3.20 m",
                    Area: "28.0 m²",
                    Volume: "9.8 m³",
                    FireRating: "REI 180",
                  }
                },
                {
                  id: "#105",
                  type: "IfcColumn",
                  name: "Facade Steel Column C1",
                  visible: true,
                  properties: {
                    GlobalId: "9nE5d_ua88vb3WzYr6f1Xx",
                    Material: "Structural Steel S355",
                    Profile: "HEB 200",
                    LoadBearing: "YES",
                    Height: "3.20 m",
                    Volume: "0.22 m³",
                  }
                },
                {
                  id: "#106",
                  type: "IfcColumn",
                  name: "Facade Steel Column C2",
                  visible: true,
                  properties: {
                    GlobalId: "0pF6e_vb99vc4WzZr7f2Yy",
                    Material: "Structural Steel S355",
                    Profile: "HEB 200",
                    LoadBearing: "YES",
                    Height: "3.20 m",
                    Volume: "0.22 m³",
                  }
                },
                {
                  id: "#107",
                  type: "IfcDoor",
                  name: "Main Entrance Pivot Door",
                  visible: true,
                  properties: {
                    GlobalId: "1qG7f_wc00vd5WzAr8f3Zz",
                    Material: "Thermo-treated Oak with Steel Subframe",
                    Width: "1500 mm",
                    Height: "2400 mm",
                    ThermalTransmittance: "0.85 W/m²K",
                    FireRating: "EI 30",
                  }
                },
                {
                  id: "#108",
                  type: "IfcWindow",
                  name: "Panoramic West Facade Glazing 1",
                  visible: true,
                  properties: {
                    GlobalId: "2rH8g_xd11ve6WzBr9f4Aa",
                    Material: "Triple Glazed Argon - Low-E",
                    FrameMaterial: "Anodized Black Aluminum",
                    Width: "4000 mm",
                    Height: "3000 mm",
                    ThermalTransmittance: "0.62 W/m²K",
                  }
                },
                {
                  id: "#109",
                  type: "IfcWindow",
                  name: "Panoramic West Facade Glazing 2",
                  visible: true,
                  properties: {
                    GlobalId: "3sI9h_ye22vf7WzCr0f5Bb",
                    Material: "Triple Glazed Argon - Low-E",
                    FrameMaterial: "Anodized Black Aluminum",
                    Width: "4000 mm",
                    Height: "3000 mm",
                    ThermalTransmittance: "0.62 W/m²K",
                  }
                },
                {
                  id: "#110",
                  type: "IfcFurnishingElement",
                  name: "Bespoke Oak Dining Table",
                  visible: true,
                  properties: {
                    GlobalId: "4tJ0i_zf33vg8WzDr1f6Cc",
                    Material: "Solid White Oak",
                    Dimensions: "2400x1000x750 mm",
                  }
                },
                {
                  id: "#111",
                  type: "IfcFurnishingElement",
                  name: "Modular Lounge Sofa Section",
                  visible: true,
                  properties: {
                    GlobalId: "5uK1j_ag44vh9WzEr2f7Dd",
                    Material: "Wool Blend Upholstery",
                    Dimensions: "3200x2100x800 mm",
                  }
                }
              ]
            },
            {
              id: "#50",
              type: "IfcBuildingStorey",
              name: "First Floor (Level +3.20)",
              visible: true,
              properties: {
                GlobalId: "3eO2z_uS85vT6WzAr2f7Qs",
                Elevation: "3.20 m",
                Height: "3.00 m",
                StoreyType: "Private Bedrooms & Terrace",
              },
              children: [
                {
                  id: "#201",
                  type: "IfcSlab",
                  name: "Intermediate Floor Slab - Concrete",
                  visible: true,
                  properties: {
                    GlobalId: "6vL2k_bh55vi0WzFr3f8Ee",
                    Material: "Concrete C30/37 + Acoustic Underlay",
                    Thickness: "250 mm",
                    LoadBearing: "YES",
                    Volume: "40.0 m³",
                    Area: "160 m²",
                    FireRating: "REI 90",
                  }
                },
                {
                  id: "#202",
                  type: "IfcWallStandardCase",
                  name: "North Facade Solid Wall",
                  visible: true,
                  properties: {
                    GlobalId: "7wM3l_ci66vj1WzGr4f9Ff",
                    Material: "Insulated Concrete Formwork",
                    Thickness: "250 mm",
                    LoadBearing: "YES",
                    Height: "3.00 m",
                    Area: "42.0 m²",
                    Volume: "10.5 m³",
                    FireRating: "REI 90",
                  }
                },
                {
                  id: "#203",
                  type: "IfcWallStandardCase",
                  name: "Bedroom Partition Wall 1",
                  visible: true,
                  properties: {
                    GlobalId: "8xN4m_dj77vk2WzHr5f0Gg",
                    Material: "Plasterboard with Rockwool Acoustic Core",
                    Thickness: "125 mm",
                    LoadBearing: "NO",
                    Height: "3.00 m",
                    Area: "18.5 m²",
                    SoundInsulation: "52 dB",
                  }
                },
                {
                  id: "#204",
                  type: "IfcWallStandardCase",
                  name: "Bedroom Partition Wall 2",
                  visible: true,
                  properties: {
                    GlobalId: "9yO5n_ek88vl3WzIr6f1Hh",
                    Material: "Plasterboard with Rockwool Acoustic Core",
                    Thickness: "125 mm",
                    LoadBearing: "NO",
                    Height: "3.00 m",
                    Area: "15.0 m²",
                    SoundInsulation: "52 dB",
                  }
                },
                {
                  id: "#205",
                  type: "IfcColumn",
                  name: "Terrace Structural Post",
                  visible: true,
                  properties: {
                    GlobalId: "0zP6o_fl99vm4WzJr7f2Ii",
                    Material: "Structural Steel S355 (Powder-coated)",
                    Profile: "Circular hollow section CHS 120x6.3",
                    LoadBearing: "YES",
                    Height: "3.00 m",
                  }
                },
                {
                  id: "#206",
                  type: "IfcWindow",
                  name: "Master Suite Balcony Slider",
                  visible: true,
                  properties: {
                    GlobalId: "1aQ7p_gm00vn5WzKr8f3Jj",
                    Material: "Double Glazed low-emissivity laminated",
                    Width: "3000 mm",
                    Height: "2600 mm",
                    OperationType: "Horizontal sliding",
                  }
                },
                {
                  id: "#207",
                  type: "IfcWindow",
                  name: "Guest Room High Slot Window",
                  visible: true,
                  properties: {
                    GlobalId: "2bR8q_hn11vo6WzLr9f4Kk",
                    Material: "Frosted Double Glazing",
                    Width: "2400 mm",
                    Height: "600 mm",
                  }
                },
                {
                  id: "#208",
                  type: "IfcRailing",
                  name: "Terrace Frameless Glass Railing",
                  visible: true,
                  properties: {
                    GlobalId: "3cS9r_io22vp7WzMr0f5Ll",
                    Material: "Laminated Tempered Glass + SS base channel",
                    Height: "1100 mm",
                    LoadBearing: "YES (Line load 1.5 kN/m)",
                  }
                },
                {
                  id: "#209",
                  type: "IfcFurnishingElement",
                  name: "King Bed Frame with Headboard",
                  visible: true,
                  properties: {
                    GlobalId: "4dT0s_jp33vq8WzNr1f6Mm",
                    Material: "Walnut Wood Veneer & Linen",
                  }
                }
              ]
            },
            {
              id: "#60",
              type: "IfcBuildingStorey",
              name: "Roof Level (Level +6.20)",
              visible: true,
              properties: {
                GlobalId: "4fP3a_vT96vU7WzBr3f8Rt",
                Elevation: "6.20 m",
                Height: "0.40 m",
                StoreyType: "Green Roof & PV Array Area",
              },
              children: [
                {
                  id: "#301",
                  type: "IfcSlab",
                  name: "Roof Slab - Insulated Waterproof",
                  visible: true,
                  properties: {
                    GlobalId: "5eU1t_kq44vr9WzOr2f7Nn",
                    Material: "Inverted Concrete Slab with EPDM Layer",
                    Thickness: "350 mm",
                    UValue: "0.15 W/m²K",
                    LoadBearing: "YES",
                    Volume: "56.0 m³",
                    Area: "160 m²",
                  }
                },
                {
                  id: "#302",
                  type: "IfcRailing",
                  name: "Roof Access Parapet Screen",
                  visible: true,
                  properties: {
                    GlobalId: "6fV2u_lr55vs0WzPr3f8Oo",
                    Material: "Zinc cladding over blockwork",
                    Height: "600 mm",
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};

// --- PRESET 2: OFFICE CORE HIERARCHY ---
export const OFFICE_HIERARCHY: BimElement = {
  id: "#10-off",
  type: "IfcProject",
  name: "Commercial Office Core Project",
  visible: true,
  properties: {
    GlobalId: "0oR$9_vY56vP4WzQr7f3Lm",
    Name: "HQ Corporate Tower Core",
    Description: "BIM LOD 350 Structural Framing & Shaft",
    Phase: "Tendering Stage",
  },
  children: [
    {
      id: "#20-off",
      type: "IfcSite",
      name: "Metropolitan Business District Lot 4",
      visible: true,
      properties: {
        Elevation: "12.5 m",
        SiteSoilClass: "S1 (Solid Rock/Highly Consolidated)",
      },
      children: [
        {
          id: "#30-off",
          type: "IfcBuilding",
          name: "Main Tower Structure",
          visible: true,
          properties: {
            GrossArea: "2,450 m²",
            StructuralSystem: "Reinforced Concrete Shear Core with Steel Outriggers",
          },
          children: [
            {
              id: "#40-off",
              type: "IfcBuildingStorey",
              name: "Ground Floor Lobby (Level 0.00)",
              visible: true,
              properties: { Elevation: "0.00 m", Height: "4.50 m" },
              children: [
                {
                  id: "#o101",
                  type: "IfcSlab",
                  name: "Heavy-Duty Base Raft Foundation",
                  visible: true,
                  properties: { Material: "Concrete C40/50 Sulfate-Resistant", Thickness: "800 mm", LoadBearing: "YES", Volume: "240 m³" }
                },
                {
                  id: "#o102",
                  type: "IfcWall",
                  name: "Core Elevator Shaft - Concrete Wall A",
                  visible: true,
                  properties: { Material: "Concrete C50/60", Thickness: "400 mm", LoadBearing: "YES", FireRating: "REI 240", Height: "4.50 m" }
                },
                {
                  id: "#o103",
                  type: "IfcWall",
                  name: "Core Service Shaft - Concrete Wall B",
                  visible: true,
                  properties: { Material: "Concrete C50/60", Thickness: "400 mm", LoadBearing: "YES", FireRating: "REI 240", Height: "4.50 m" }
                },
                {
                  id: "#o104",
                  type: "IfcColumn",
                  name: "Structural Portal Column SC1",
                  visible: true,
                  properties: { Material: "Steel-Concrete Composite (HEB 400 + C50 Encasing)", LoadBearing: "YES", Height: "4.50 m" }
                },
                {
                  id: "#o105",
                  type: "IfcColumn",
                  name: "Structural Portal Column SC2",
                  visible: true,
                  properties: { Material: "Steel-Concrete Composite (HEB 400 + C50 Encasing)", LoadBearing: "YES", Height: "4.50 m" }
                },
                {
                  id: "#o106",
                  type: "IfcDoor",
                  name: "Main Revolving Automatic Glass Door",
                  visible: true,
                  properties: { Material: "Stainless Steel & Toughened Glass", Width: "3200 mm", Height: "2800 mm" }
                },
                {
                  id: "#o107",
                  type: "IfcWindow",
                  name: "Lobby Curtain Wall Unit West",
                  visible: true,
                  properties: { FrameMaterial: "Structural Silicon Glazing (SSG)", Height: "4500 mm", Width: "6000 mm" }
                }
              ]
            },
            {
              id: "#50-off",
              type: "IfcBuildingStorey",
              name: "Level 1 Open Office (Level +4.50)",
              visible: true,
              properties: { Elevation: "4.50 m", Height: "3.60 m" },
              children: [
                {
                  id: "#o201",
                  type: "IfcSlab",
                  name: "Composite Steel Decking Floor Slab",
                  visible: true,
                  properties: { Material: "Concrete over trapezoidal steel sheet Profile", Thickness: "150 mm", LoadBearing: "YES", Area: "450 m²" }
                },
                {
                  id: "#o202",
                  type: "IfcBeam",
                  name: "Primary Structural Steel Beam B1",
                  visible: true,
                  properties: { Material: "Steel S355", Profile: "IPE 450", Height: "450 mm" }
                },
                {
                  id: "#o203",
                  type: "IfcBeam",
                  name: "Primary Structural Steel Beam B2",
                  visible: true,
                  properties: { Material: "Steel S355", Profile: "IPE 450", Height: "450 mm" }
                },
                {
                  id: "#o204",
                  type: "IfcWall",
                  name: "Core Lift Shaft - Level 1 Section",
                  visible: true,
                  properties: { Material: "Concrete C50/60", Thickness: "350 mm", LoadBearing: "YES", Height: "3.60 m" }
                },
                {
                  id: "#o205",
                  type: "IfcColumn",
                  name: "Framing H-Column C11",
                  visible: true,
                  properties: { Material: "Steel S355", Profile: "HEB 260", Height: "3.60 m" }
                },
                {
                  id: "#o206",
                  type: "IfcColumn",
                  name: "Framing H-Column C12",
                  visible: true,
                  properties: { Material: "Steel S355", Profile: "HEB 260", Height: "3.60 m" }
                },
                {
                  id: "#o207",
                  type: "IfcWindow",
                  name: "Spandrel-Integrated Glazing Unit",
                  visible: true,
                  properties: { FrameMaterial: "Dark Gray Powder-coated Al", Width: "3000 mm", Height: "3200 mm" }
                }
              ]
            },
            {
              id: "#60-off",
              type: "IfcBuildingStorey",
              name: "Level 2 (Level +8.10)",
              visible: true,
              properties: { Elevation: "8.10 m", Height: "3.60 m" },
              children: [
                {
                  id: "#o301",
                  type: "IfcSlab",
                  name: "Composite Steel Decking Floor Slab",
                  visible: true,
                  properties: { Material: "Concrete over trapezoidal steel sheet Profile", Thickness: "150 mm", LoadBearing: "YES" }
                },
                {
                  id: "#o302",
                  type: "IfcColumn",
                  name: "Framing H-Column C21",
                  visible: true,
                  properties: { Material: "Steel S355", Profile: "HEB 260", Height: "3.60 m" }
                },
                {
                  id: "#o303",
                  type: "IfcColumn",
                  name: "Framing H-Column C22",
                  visible: true,
                  properties: { Material: "Steel S355", Profile: "HEB 260", Height: "3.60 m" }
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};

// --- PRESET 3: WAREHOUSE HIERARCHY ---
export const WAREHOUSE_HIERARCHY: BimElement = {
  id: "#10-war",
  type: "IfcProject",
  name: "Logistics Hub Warehouse Project",
  visible: true,
  properties: {
    GlobalId: "9pY$1_dY43vP4WzQr7f3Lm",
    Name: "MegaLogistics Warehouse Site",
    Description: "BIM LOD 300 Structural Steel Portal Frame",
    Phase: "Design Development",
  },
  children: [
    {
      id: "#20-war",
      type: "IfcSite",
      name: "Industrial Zoning Park - Phase 2",
      visible: true,
      properties: {
        SiteSoilClass: "S3 (Loose Sand / Stiff Silt, requiring pad foundations)",
      },
      children: [
        {
          id: "#30-war",
          type: "IfcBuilding",
          name: "Distribution Center",
          visible: true,
          properties: {
            GrossArea: "1,200 m²",
            StructuralSystem: "Steel Portal Frames with Lattice Web Trusses",
          },
          children: [
            {
              id: "#40-war",
              type: "IfcBuildingStorey",
              name: "Main Floor (Level 0.00)",
              visible: true,
              properties: { Elevation: "0.00 m", Height: "8.50 m" },
              children: [
                {
                  id: "#w101",
                  type: "IfcSlab",
                  name: "Heavy-Duty Fiber-Reinforced SOG",
                  visible: true,
                  properties: {
                    Material: "Concrete C35/45 Steel-Fiber Reinforced",
                    Thickness: "250 mm",
                    LoadBearing: "YES",
                    SlabOnGrade: "YES",
                    LoadCapacity: "60 kN/m² Static"
                  }
                },
                {
                  id: "#w102",
                  type: "IfcColumn",
                  name: "Portal Frame Main Column A1",
                  visible: true,
                  properties: { Material: "Steel S355", Profile: "HEB 300", LoadBearing: "YES", Height: "8.50 m" }
                },
                {
                  id: "#w103",
                  type: "IfcColumn",
                  name: "Portal Frame Main Column A2",
                  visible: true,
                  properties: { Material: "Steel S355", Profile: "HEB 300", LoadBearing: "YES", Height: "8.50 m" }
                },
                {
                  id: "#w104",
                  type: "IfcColumn",
                  name: "Portal Frame Main Column A3",
                  visible: true,
                  properties: { Material: "Steel S355", Profile: "HEB 300", LoadBearing: "YES", Height: "8.50 m" }
                },
                {
                  id: "#w105",
                  type: "IfcBeam",
                  name: "Lattice Roof Truss T-1",
                  visible: true,
                  properties: { Material: "Steel S355 Welded Angles", Length: "24.0 m", Span: "24.0 m" }
                },
                {
                  id: "#w106",
                  type: "IfcBeam",
                  name: "Lattice Roof Truss T-2",
                  visible: true,
                  properties: { Material: "Steel S355 Welded Angles", Length: "24.0 m", Span: "24.0 m" }
                },
                {
                  id: "#w107",
                  type: "IfcWall",
                  name: "Precast Concrete Plinth Wall",
                  visible: true,
                  properties: { Material: "Precast Insulated Concrete Sandwich", Thickness: "300 mm", Height: "2.40 m" }
                },
                {
                  id: "#w108",
                  type: "IfcWall",
                  name: "Insulated Sandwich Metal Cladding",
                  visible: true,
                  properties: { Material: "PIR Insulated sandwich profile panel", Thickness: "100 mm", Height: "6.10 m" }
                },
                {
                  id: "#w109",
                  type: "IfcDoor",
                  name: "Loading Dock Leveler Door 1",
                  visible: true,
                  properties: { Material: "Sectional PU insulated steel panels", Width: "3000 mm", Height: "3500 mm", Operation: "Motorized overhead roll-up" }
                },
                {
                  id: "#w110",
                  type: "IfcDoor",
                  name: "Loading Dock Leveler Door 2",
                  visible: true,
                  properties: { Material: "Sectional PU insulated steel panels", Width: "3000 mm", Height: "3500 mm", Operation: "Motorized overhead roll-up" }
                },
                {
                  id: "#w111",
                  type: "IfcWindow",
                  name: "Roof Polycarbonate Skylight Ribbon",
                  visible: true,
                  properties: { Material: "Multi-wall Polycarbonate UV Protected", Width: "12000 mm", Height: "1200 mm" }
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};
