import { getCustomRepository, getRepository, In } from 'typeorm';
import csv from 'csv-parse';
import fs from 'fs';
import path from 'path';

import uploadConfig from '../config/upload';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
    filename: string;
}

interface DataCSV {
    title: string;
    type: 'income' | 'outcome';
    value: number;
    categoryTitle: string;
}

class ImportTransactionsService {
    public async execute({ filename }: Request): Promise<Transaction[]> {
        const fileReadStream = fs.createReadStream(
            path.join(uploadConfig.directory, filename),
        );

        const parseCSV = fileReadStream.pipe(
            csv({
                from_line: 2,
            }),
        );

        const importedTransactions: DataCSV[] = [];

        parseCSV.on('data', data => {
            const [title, type, value, categoryTitle]: [
                string,
                'income' | 'outcome',
                number,
                string,
            ] = data.map((cell: string) => cell.trim());

            if (!title || (type !== 'income' && type !== 'outcome') || !value)
                return;

            importedTransactions.push({
                title,
                type,
                value,
                categoryTitle,
            });
        });

        await new Promise(resolve => parseCSV.on('end', resolve));

        const transactionsRepository = getCustomRepository(
            TransactionsRepository,
        );

        const categoryRepository = getRepository(Category);

        const existentCategories = await categoryRepository.find({
            where: {
                title: In(
                    importedTransactions.map(
                        importedTransaction =>
                            importedTransaction.categoryTitle,
                    ),
                ),
            },
        });

        const existentCategoriesTitles = existentCategories.map(
            category => category.title,
        );

        const addCategoryTitles = importedTransactions
            .map(importedTransaction => importedTransaction.categoryTitle)
            .filter(category => !existentCategoriesTitles.includes(category))
            .filter((value, index, self) => self.indexOf(value) === index);

        const newCategories = categoryRepository.create(
            addCategoryTitles.map(title => ({
                title,
            })),
        );

        await categoryRepository.save(newCategories);

        const allCategories = [...newCategories, ...existentCategories];

        const newTransactions = transactionsRepository.create(
            importedTransactions.map(
                ({ title, type, value, categoryTitle }) => ({
                    title,
                    type,
                    value,
                    category: allCategories.find(
                        category => category.title === categoryTitle,
                    ),
                }),
            ),
        );

        await transactionsRepository.save(newTransactions);

        await fs.promises.unlink(path.join(uploadConfig.directory, filename));

        return newTransactions;
    }
}

export default ImportTransactionsService;
