import React from "react";
import "./styles.css";
import { PiSealPercentBold } from "react-icons/pi";
import Skeleton from "../Skeleton";

const BoxdeImpostosSkeleton: React.FC = () => {
  return (
    <div className="class-tributaria-title">
      <div className="flex items-center w-full">
        <h3 className="text-xl font-semibold color-gray-100 gap-2 flex items-center">
          <PiSealPercentBold /> Classificação Tributária
        </h3>
      </div>
      <hr className="border-gray-600 my-4" />
      <div className="grid-container-inner">
        <div className="box-tributaria col-span-12 tablet-col-span-12 mobile-col-span-4">
          <div className="box-tributaria-row flex flex-row gap-4 md:flex-row mobile:flex-col">
            <div className="box-tributaria-item flex flex-col w-1/2 mobile:w-full gap-4">
              <div className="box-tributaria-row">
                <h4 className="text-sm mb-2">IPI</h4>
                <div className="flex w-full gap-3">
                  <span className="w-1/2 text-gray-300">
                    <div className="input-field">
                      <label>Entrada:</label>
                      <div className="skeleton-input">
                        <Skeleton height="20px" />
                      </div>
                    </div>
                  </span>
                  <span className="w-1/2 text-gray-300">
                    <div className="input-field">
                      <label>Saída:</label>
                      <div className="skeleton-input">
                        <Skeleton height="20px" />
                      </div>
                    </div>
                  </span>
                </div>
              </div>
              <div className="box-tributaria-item">
                <h4 className="text-sm mb-2">COFINS</h4>
                <div className="flex w-full gap-3">
                  <span className="w-1/2 text-gray-300">
                    <div className="input-field">
                      <label>Entrada:</label>
                      <div className="skeleton-input">
                        <Skeleton height="20px" />
                      </div>
                    </div>
                  </span>
                  <span className="w-1/2 text-gray-300">
                    <div className="input-field">
                      <label>Saída:</label>
                      <div className="skeleton-input">
                        <Skeleton height="20px" />
                      </div>
                    </div>
                  </span>
                </div>
              </div>
            </div>

            <div className="box-tributaria-item flex flex-col w-1/2 mobile:w-full gap-4">
              <div className="box-tributaria-row">
                <h4 className="text-sm mb-2">PIS</h4>
                <div className="flex w-full gap-3">
                  <span className="w-1/2 text-gray-300">
                    <div className="input-field">
                      <label>Entrada:</label>
                      <div className="skeleton-input">
                        <Skeleton height="20px" />
                      </div>
                    </div>
                  </span>
                  <span className="w-1/2 text-gray-300">
                    <div className="input-field">
                      <label>Saída:</label>
                      <div className="skeleton-input">
                        <Skeleton height="20px" />
                      </div>
                    </div>
                  </span>
                </div>
              </div>

              <div className="box-tributaria-item">
                <h4 className="text-sm mb-2">CST</h4>
                <div className="flex w-full gap-3">
                  <span className="w-1/2 text-gray-300">
                    <div className="input-field">
                      <label>Entrada:</label>
                      <div className="skeleton-input">
                        <Skeleton height="20px" />
                      </div>
                    </div>
                  </span>
                  <span className="w-1/2 text-gray-300">
                    <div className="input-field">
                      <label>Saída:</label>
                      <div className="skeleton-input">
                        <Skeleton height="20px" />
                      </div>
                    </div>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoxdeImpostosSkeleton; 