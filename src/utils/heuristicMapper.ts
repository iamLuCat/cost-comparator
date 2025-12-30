import type { CostMapping } from '../types';

export const removeDiacritics = (str: string): string => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

export const scanHeaders = (headers: string[]): CostMapping => {
    const mapping: CostMapping = {
        contractNo: '',
        date: '',
        billNo: '',
        liftUnload: [],
        containerDeposit: [],
        toll: [],
        transportFee: [],
        freightCharge: [],
        warehouseTransfer: []
    };

    headers.forEach((h) => {
        const raw = h || "";
        const header = removeDiacritics(raw).trim();

        // Exact/Strong matches for Keys
        if (header.includes("so cont") || header === "cont" || header === "container") mapping.contractNo = h;
        if (header === "ngay" || header.includes("ngay van chuyen") || header.includes("ngay vc")) mapping.date = h;
        if (header.includes("so bill") || header === "bill") mapping.billNo = h;

        // Keyword matching for Cost Categories
        // Lift/Unload
        if (header === "ha" || header === "nang" || header.includes("phi ha") || header.includes("phi nang")) {
            mapping.liftUnload.push(h);
        }

        // Deposit
        if (header.includes("gui cont") || header.includes("neo xe") || header.includes("cuoc vo")) {
            mapping.containerDeposit.push(h);
        }

        // Toll
        if (header.includes("bot") || header.includes("spitc") || header.includes("sp-itc") || header.includes("cau duong")) {
            mapping.toll.push(h);
        }

        // Transport
        if (header.includes("cuoc xe") || header.includes("phi van chuyen") || header === "vc") {
            mapping.transportFee.push(h);
        }

        // Freight
        if (header.includes("cuoc cont")) {
            mapping.freightCharge.push(h);
        }

        // Warehouse
        if (header.includes("chuyen kho") || header.includes("luu kho")) {
            mapping.warehouseTransfer.push(h);
        }
    });

    return mapping;
};
