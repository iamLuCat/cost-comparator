import type { CostMapping } from '../types';

export const removeDiacritics = (str: string): string => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "d").toLowerCase();
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
        warehouseTransfer: [],
        weighingFee: [],
        cleaningFee: [],
        overweightFee: [],
        detentionFee: [],
        storageFee: [],
        vat: []
    };

    headers.forEach((h) => {
        const raw = h || "";
        const header = removeDiacritics(raw).trim();

        // PRIORITY: Exact matches for IDs first
        if (header.includes("so cont") || header === "cont" || header === "container") {
            mapping.contractNo = h;
            return; // Exclusive
        }
        if (header === "ngay" || header.includes("ngay van chuyen") || header.includes("ngay vc")) {
            mapping.date = h;
            return;
        }
        if (header.includes("so bill") || header === "bill") {
            mapping.billNo = h;
            return;
        }

        // Cost Categories (Exclusive)
        // If it matches one, stop checking others.
        const rawLower = raw.toLowerCase();

        // 1. Detention Fee (Phí Neo Xe)
        if (header.includes("neo xe") || header === "neo" || header.includes("detention")) {
            mapping.detentionFee.push(h);
            return;
        }

        // 2. Storage Fee (Phí Gửi Cont / Lưu Bãi)
        if (header.includes("gui cont") || header.includes("luu bai") || header.includes("storage") || header.includes("luu cont")) {
            mapping.storageFee.push(h);
            return;
        }

        // 3. Deposit (Cược Vỏ / Cược Cont)
        // Check "Cược" specifically if possible, otherwise fall back to common terms
        if (rawLower.includes("cược") || header.includes("cuoc vo") || header.includes("deposit")) {
            mapping.containerDeposit.push(h);
            return;
        }


        // Lift/Unload
        if (header === "ha" || header === "nang" || header.includes("phi ha") || header.includes("phi nang") || header.includes("lift") || header.includes("lo/lo")) {
            mapping.liftUnload.push(h);
            return;
        }

        // Toll
        if (header.includes("bot") || header.includes("spitc") || header.includes("sp-itc") || header.includes("cau duong") || header.includes("sp itc")) {
            mapping.toll.push(h);
            return;
        }

        // Transport (Trucking)
        if (header.includes("cuoc xe") || header.includes("phi van chuyen") || header === "vc" || header === "phi vc" || header.includes("trucking")) {
            mapping.transportFee.push(h);
            return;
        }

        // Warehouse
        if (header.includes("chuyen kho") || header.includes("luu kho") || header.includes("warehouse")) {
            mapping.warehouseTransfer.push(h);
            return;
        }

        // Weighing Fee
        if (header.includes("can xe") || header.includes("phi can") || header.includes("weighing")) {
            mapping.weighingFee.push(h);
            return;
        }

        // Cleaning Fee (NEW)
        if (header.includes("ve sinh") || header.includes("cleaning") || header.includes("rua cont") || header.includes("washing") || header.includes("phi ve sinh") || header.includes("hoa don vsc") || header.includes("vsc")) {
            mapping.cleaningFee.push(h);
            return;
        }

        // Overweight Fee (NEW)
        if (header.includes("qua tai") || header.includes("overweight") || header.includes("phi qua tai")) {
            mapping.overweightFee.push(h);
            return;
        }



        // VAT
        if (!(header.includes("thanh tien dich vu")) && (header.includes("thue") || header.includes("vat"))) {
            mapping.vat.push(h);
            return;
        }
    });

    return mapping;
};
