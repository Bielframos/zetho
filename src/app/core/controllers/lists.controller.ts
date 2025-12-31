import { computed, Injectable, signal } from '@angular/core';
import { AppwriteException } from 'appwrite';
import {
    CreateListInput,
    LastAdditionItem,
    ListService,
} from '../services/list.service';
import { AppError, GameRow, ZereiListRow } from '../types';

export type ParsedZereiListRow = ZereiListRow & {
    parsedLatestAdditions?: LastAdditionItem[];
};

/**
 * Controller responsável por gerenciar listas de jogos do usuário.
 * Fornece funcionalidades para carregar, criar e adicionar itens às listas.
 */
@Injectable({ providedIn: 'root' })
export class ListsController {
    /** Lista de listas parseadas do usuário. */
    lists = signal<ParsedZereiListRow[]>([]);

    /** Número total de listas disponíveis. */
    total = signal(0);
    /** Página atual sendo carregada. */
    currentPage = signal(0);
    /** Offset calculado baseado na página atual (12 itens por página). */
    offset = computed(() => this.currentPage() * 12);
    /** Número total de páginas calculado. */
    pageCount = computed(() => Math.ceil(this.total() / 12));

    /** Indica se uma operação de carregamento está em andamento. */
    loading = signal<boolean>(false);
    /** Indica se há mais listas para carregar. */
    hasMore = signal<boolean>(false);

    /** Indica se uma criação de lista está aguardando. */
    awaitingCreation = signal<boolean>(false);
    /** Erro atual, se houver. */
    error = signal<AppError | undefined>(undefined);

    /**
     * Construtor do controller.
     * @param listService Serviço para operações relacionadas a listas.
     */
    constructor(private listService: ListService) { }

    /**
     * Carrega as listas do usuário, com opção de carregar mais páginas.
     * @param ownerFingerprint Identificador único do proprietário das listas.
     * @param loadMore Se verdadeiro, carrega a próxima página; caso contrário, reinicia a lista.
     */
    async loadLists({
        ownerFingerprint,
        loadMore,
        onlyPublicOnes
    }: {
        ownerFingerprint: string;
        loadMore?: boolean;
        onlyPublicOnes?: boolean
    }) {
        try {
            if (this.loading()) return;
            this.loading.set(true);

            if (loadMore) {
                this.currentPage.update((p) => p + 1);
            }

            const lists = await this.listService.getLists({
                userFingerprint: ownerFingerprint,
                offset: this.offset(),
                onlyPublicOnes
            });

            const parsedRows: ParsedZereiListRow[] = lists.rows.map(this.parseList);

            if (loadMore) {
                this.lists.update((state) => [...state, ...parsedRows]);
            } else {
                this.lists.set(parsedRows);
            }

            const loaded = this.lists().length;
            this.hasMore.set(loaded < lists.total);

            this.total.set(lists.total);
        } catch (e) {
            const error = e as AppwriteException;
            console.error(e);
            this.error.set({
                message: error.message,
                code: error.code,
                type: error.type,
            });
        } finally {
            this.loading.set(false);
        }
    }

    /**
     * Cria uma nova lista e a adiciona ao início da lista de listas.
     * @param props Dados de entrada para criar a lista.
     */
    async createList(props: CreateListInput) {
        try {
            this.awaitingCreation.set(true);
            const newList = await this.listService.createList(props);
            this.lists.update((state) => [this.parseList(newList), ...state]);
        } catch (e) {
            const error = e as AppwriteException;
            console.error(e);

            this.error.set({
                message: error.message,
                code: error.code,
                type: error.type,
            });
        } finally {
            this.awaitingCreation.set(false);
        }
    }

    /**
     * Adiciona um jogo a uma lista existente.
     * @param list A lista à qual o jogo será adicionado.
     * @param game O jogo a ser adicionado.
     */
    async addItem({
        list,
        game,
    }: {
        list?: ZereiListRow;
        game?: GameRow | null;
    }) {
        if (!list || !game) {
            this.error.set({
                message: 'Lista ou jogo não informados.',
                code: 400,
                type: 'bad_request',
            });

            alert('Lista ou jogo não informados.');
            return
        }

        try {
            const response = await this.listService.addToList({ list, game });

            this.lists.update((prev) =>
                prev.map((item) =>
                    item.$id === list.$id ? this.parseList(response.updatedList) : item,
                ),
            );
        } catch (e) {
            const error = e as AppwriteException;
            console.error(e);

            this.error.set({
                message: error.message,
                code: error.code,
                type: error.type,
            });
        }
    }

    /**
     * Faz o parse da lista, convertendo latestAdditions de string JSON para objetos.
     * @param list A lista a ser parseada.
     * @returns A lista parseada.
     */
    parseList(list: ZereiListRow) {
        return {
            ...list,
            parsedLatestAdditions: list.latestAdditions?.map((item) =>
                JSON.parse(item),
            ),
        };
    }
}
