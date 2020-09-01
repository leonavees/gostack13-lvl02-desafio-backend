// import AppError from '../errors/AppError';

import { getRepository, getCustomRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';
import AppError from '../errors/AppError';

interface Request {
    title: string;
    value: number;
    type: 'income' | 'outcome';
    category: string;
}
class CreateTransactionService {
    public async execute({
        title,
        value,
        type,
        category,
    }: Request): Promise<Transaction> {
        const categoryRepository = getRepository(Category);
        const transactionsRepository = getCustomRepository(
            TransactionsRepository,
        );

        const balance = await transactionsRepository.getBalance();

        if (type === 'outcome' && value > balance.total) {
            throw new AppError('Insufficient balance');
        }

        const categoryExits = await categoryRepository.findOne({
            where: { title: category },
        });

        let category_id = '';

        if (categoryExits) {
            category_id = categoryExits.id;
        } else {
            const newCategory = categoryRepository.create({
                title: category,
            });

            await categoryRepository.save(newCategory);

            category_id = newCategory.id;
        }

        const transaction = transactionsRepository.create({
            title,
            value,
            type,
            category_id,
        });

        await transactionsRepository.save(transaction);

        return transaction;
    }
}

export default CreateTransactionService;
